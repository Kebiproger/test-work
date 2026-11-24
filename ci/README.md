# CI/CD: контракт и запуск

Вся логика CI/CD живёт в `Makefile` и `ci/*.sh`. Файлы провайдеров
(`.github/workflows/ci-cd.yml`, `.gitlab-ci.yml`) только вызывают `make`.
Смена провайдера означает замену тонкого YAML, логика не меняется.

## Контракт переменных

| Переменная | Обязательна | Формат | Пример | Где используется |
|---|---|---|---|---|
| `REGISTRY` | да (кроме `help`, `lint`, `test`, `scan`) | нижний регистр, без пробелов: `хост/путь` | `ghcr.io/kebiproger`, `registry.gitlab.com/group/project`, `local/test` | `build`, `push`, `deploy` |
| `APP` | нет, по умолчанию `flower` | имя приложения | `flower` | `build`, `push`, `deploy` |
| `TAG` | да для `build`, `push`, `deploy` | `sha-` + 7..40 строчных hex: `sha-[0-9a-f]{7,40}` | `sha-1234567` | `build`, `push`, `deploy` |
| `DEPLOY_DIR` | да только для `deploy` | **абсолютный** путь (начинается с `/`), существующий каталог на хосте, в котором лежит `.env` | `/srv/flower` | `deploy` |
| `REGISTRY_USER` | нет (нужна, если задан токен) | имя пользователя реестра | `kebi` | `deploy` |
| `REGISTRY_TOKEN` | нет | токен реестра, передаётся только через stdin | (секрет) | `deploy` |

Образы: `${REGISTRY}/${APP}-backend:${TAG}` и `${REGISTRY}/${APP}-frontend:${TAG}`.
Контекст сборки: `./backend` и `./frontend`.

`TAG` проверяется по всей строке (`grep -Eqx`). Плавающие теги, `sha-abc`,
`sha-abcdef1-junk` и значения с заглавными буквами отклоняются с сообщением об ошибке.
Значения `REGISTRY` с заглавными буквами или пробелами тоже отклоняются.

## Цели Make

| Цель | Что делает | Скрипт |
|---|---|---|
| `make help` | перечисляет цели (по умолчанию) | — |
| `make lint` | shellcheck для `ci/*.sh` и `scripts/*.sh`, actionlint для workflow (через закреплённые образы) | `ci/lint.sh` |
| `make test` | запускает тесты backend/frontend; сейчас тестов нет, выводит `no tests configured` | `ci/test.sh` |
| `make build` | собирает оба образа с тегом `${REGISTRY}/${APP}-*:${TAG}` | `ci/build.sh` |
| `make scan` | секреты через gitleaks по всей истории репозитория (значения редактируются), конфиг `.gitleaks.toml` если есть | `ci/scan.sh` |
| `make push` | пушит образы, собранные `make build` | `ci/push.sh` |
| `make deploy` | деплой на хост: проверяет `DEPLOY_DIR` (абсолютный путь, есть `$DEPLOY_DIR/.env`), `docker login` (опционально), `pull`, `up -d`, `prune` | `ci/deploy.sh` |

Версии инструментов закреплены в `ci/versions.env`. Плавающих тегов нигде не используется.

## Локальный запуск

`lint` и `scan` сначала ищут локальные бинарники с закреплённой версией (`shellcheck`,
`actionlint`, `gitleaks`; версии и SHA256 в `ci/versions.env`). Бинарник используется,
только если `--version` совпадает с закреплённой версией. Иначе берётся закреплённый Docker-образ,
как раньше. Поэтому на хосте без инструментов нужен Docker; с установленными инструментами
Docker не нужен. Установить инструменты локально можно через `sh ci/install-tools.sh`
(по умолчанию в `/usr/local/bin`, переменная `BIN_DIR`); скачивания проверяются по SHA256.

```bash
make help
make lint
make scan
make build REGISTRY=local/test APP=flower TAG=sha-1234567
docker images | grep flower
```

Локальный стек без переменных:

```bash
docker compose up -d --build
```

В `docker-compose.yml` у сервисов `backend` и `frontend` есть и `build:`, и `image:`
со значениями по умолчанию (`local/flower-*:dev`). Порты публикуются только на `127.0.0.1`.

## Различия GitHub и GitLab

| Тема | GitHub (`.github/workflows/ci-cd.yml`) | GitLab (`.gitlab-ci.yml`) |
|---|---|---|
| Источник `TAG` | `sha-` + первые 7 символов `GITHUB_SHA` | `sha-$CI_COMMIT_SHORT_SHA` (8 символов) |
| Источник `REGISTRY` | `ghcr.io/<owner в нижнем регистре>` | `$CI_REGISTRY_IMAGE` |
| Логин в реестр | `docker/login-action@v3` (только не для `pull_request`) | `docker login` с `CI_REGISTRY_USER`/`CI_REGISTRY_PASSWORD` внутри job `build` (только не для merge request) |
| Запуск `build` | все push в `main` и `pull_request` (через `check` и `needs`) | только push в default branch и `merge_request_event` (не каждая ветка) |
| Публикация | `make push` только не для `pull_request` | `make push` только не для `merge_request_event` |
| Деплой | job `deploy` на `self-hosted`, только `push` в `main` | job `deploy` на теге `vm-runner`, только `$CI_PIPELINE_SOURCE == "push"` в default branch, `environment: production` |
| Checkout для скана | `actions/checkout` с `fetch-depth: 0` только в job `check` (вся история для gitleaks) | `GIT_DEPTH: "0"` в job `check` (вся история для gitleaks) |
| Токен для деплоя | `GITHUB_TOKEN` (`packages: read`) | `CI_REGISTRY_PASSWORD` |
| Окружение сборки | `ubuntu-24.04` с Docker | `check`: образ `alpine:3.21.10`, инструменты ставятся `ci/install-tools.sh`, без Docker; `build`: `docker:27.5-cli` + service `docker:27.5-dind` |
| Кэш слоёв | не используется | не используется |

GitLab job `check` не использует Docker-in-Docker: в `before_script` ставятся `make`, `git`, `curl`
и через `ci/install-tools.sh` закреплённые `shellcheck`, `actionlint`, `gitleaks` (SHA256 проверяется
до распаковки). `make lint` и `make scan` находят локальные бинарники и не вызывают `docker run -v`.

## Настройка GitHub

1. Settings → Secrets and variables → Actions → Variables: добавить `DEPLOY_DIR`
   (абсолютный путь к каталогу деплоя на VM, в нём должен лежать `.env`; `make deploy`
   завершится с понятной ошибкой, если путь относительный или `.env` отсутствует).
   Сам `.env` создаётся на хосте вручную, в репозиторий и в CI он не попадает.
   Actions закреплены по полному commit SHA с комментарием `# vX.Y.Z`
   (`actions/checkout` v4.2.2, `docker/login-action` v3.7.0; SHA проверены через `git ls-remote`
   и `gh api`). Обновлять так же: сверить SHA у двух источников.
2. Установить self-hosted runner с меткой `self-hosted` на VM. Runner работает не от root,
   без доступа к Docker-сокету прода, если это возможно (группа `docker` эквивалентна root).
3. Пакеты GHCR: убедиться, что у репозитория есть право на запись в пакеты (для `build`).

## Настройка GitLab

1. Settings → CI/CD → Variables: добавить `DEPLOY_DIR` (абсолютный путь; не маскированная переменная, если путь не секрет).
   Деплой (`deploy`) запускается только на push в default branch, не на merge request и не на ветки.
2. Runner для `build`: privileged (нужен для `docker:dind`). Job `check` привилегий не требует.
3. VM-runner с тегом `vm-runner`, shell executor. На VM должны быть установлены `make`,
   Docker с плагином compose и каталог из `DEPLOY_DIR` с `.env`.
4. Версии `alpine:3.21.10`, `docker:27.5-cli` и `docker:27.5-dind` в `.gitlab-ci.yml` должны совпадать с `ci/versions.env`.

## Секретный скан и allowlist (`.gitleaks.toml`)

`ci/scan.sh` берёт `.gitleaks.toml` из корня репозитория, если он есть. Файл расширяет
стандартные правила gitleaks и содержит один узкий allowlist:

- коммит `be5c08c` (полный SHA), путь `design/Флора - экраны.dc.html`, правило `stripe-access-token`;
- все три условия должны совпасть (`condition = "AND"`);
- значение в файле — подтверждённый владельцем дизайн-мок, не настоящий ключ. В рабочем дереве
  оно уже заменено на явную заглушку-placeholder (тестовый префикс, без ключа); запись нужна, потому что коммит уже в истории.

Расширять allowlist нельзя без решения владельца: без путей-масок, без записей только по правилу
или только по коммиту, без коротких SHA (gitleaks сравнивает полный хеш). Проверено: при другом
правиле, другом коммите или другом пути находка снова попадает в отчёт. Секреты для теста не
хранятся в дереве; проверка делается во временной копии вне репозитория.

Скан монтирует репозиторий с `:ro` и не пишет отчёт (нет `--report-path`). Для git внутри
контейнера выставлен `safe.directory=/repo` через `GIT_CONFIG_*`, чтобы не было ошибки
"dubious ownership".

## Ограничения (known limitations)

- Нет кэша слоёв Docker (в GitHub был `type=gha`, в шаблоне пока не перенесён).
- Образа-инструмента CI нет: GitHub использует закреплённые Docker-образы как запасной путь, GitLab ставит бинарники.
- `make test` пока пустой: тестов в проекте нет. Если появятся тестовые файлы без настроенного
  раннера, `make test` завершится с ошибкой, а не пройдёт молча.
- `scan` использует только gitleaks. semgrep, trivy и osv-scanner не подключены.
- Фазы 3-5 плана (секреты через SOPS/Vault, Ansible для раннеров, откат деплоя и ключ с
  `restrict,command=`) вне рамок этой задачи.
- GitLab-пайплайн НЕ запускался на реальном GitLab (ни раннер, ни job `check` не проверены). Проверено только локально:
  установка инструментов с проверкой SHA256 и пути `make lint` / `make scan` на хосте.
- `deploy` не делает healthcheck и откат на предыдущий тег.
