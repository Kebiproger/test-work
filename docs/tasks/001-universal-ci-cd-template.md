# 001. Универсальный CI/CD-шаблон (фазы 1 и 2 плана)

- ID: 001
- Статус (Status): draft
- Дата (Date): 2026-11-24
- Ветка (Branch): не создана. В рабочем дереве есть незакоммиченные изменения (docker-compose.yml, .github/workflows/docker-image.yml, правки фенсов во frontend). Остаёмся на `main`, пока пользователь не решит иначе.
- Тесты агентами редактировать разрешено (Test edits by agents allowed): нет

## Запрос дословно (Verbatim request)
> @~/Documents/Job/02_Plans/Универсальный CI CD.md прочти это и надо бы сделать такой темплейт CI CD

## Понимание (Understanding)
Нужно реализовать фазы 1 и 2 плана «Универсальный CI CD» на проекте Flower_shop как на тестовом стенде. Вся логика живёт в `Makefile` и `ci/*.sh` с контрактом переменных `REGISTRY`, `APP`, `TAG`. YAML-файлы провайдеров (GitHub Actions и GitLab CI) тонкие и только вызывают `make`. Деплой выполняет self-hosted runner на VM через `make deploy`, который вызывает `ci/deploy.sh`. Это заменяет текущий `.github/workflows/docker-image.yml`. Позже шаблон будет вынесен в отдельный репозиторий `ci-templates`, поэтому сейчас он проектируется переносимым.

## Критерии приёмки (Acceptance criteria)
- [ ] 1. В корне есть `Makefile` с целями `lint`, `test`, `build`, `scan`, `push`, `deploy` и `help`; `make help` перечисляет их.
- [ ] 2. `make build REGISTRY=ghcr.io/x APP=flower TAG=sha-1234567` собирает образы backend и frontend локально без провайдера CI; `docker images` показывает теги.
- [ ] 3. Контракт переменных `REGISTRY`, `APP`, `TAG` описан в `ci/README.md`; `TAG` проверяется по шаблону `sha-[0-9a-f]{7,40}`; неверный тег останавливает `make` с понятным сообщением.
- [ ] 4. Версии инструментов (shellcheck, actionlint, gitleaks и т.д.) закреплены в `ci/versions.env`; слова `latest` нигде нет: `grep -rn latest ci Makefile .github .gitlab-ci.yml` возвращает пустой результат.
- [ ] 5. Все `ci/*.sh` написаны на POSIX sh (`#!/bin/sh`, `set -eu`) и проходят `shellcheck`.
- [ ] 6. `.github/workflows/ci-cd.yml` не длиннее 40 строк логики, только вызывает `make`, проходит `actionlint`; старый `.github/workflows/docker-image.yml` удалён.
- [ ] 7. `.gitlab-ci.yml` не длиннее 40 строк логики, те же цели и имена переменных; проверен линтером GitLab, если он доступен, иначе проверка помечена как ручная.
- [ ] 8. Провайдер приводит тег к контракту: GitHub - `sha-<7 символов SHA>`, GitLab - `sha-$CI_COMMIT_SHORT_SHA`.
- [ ] 9. `make deploy` вызывает `ci/deploy.sh` (переменные `DEPLOY_DIR`, `REGISTRY/APP`, `TAG`): `docker login` токеном через stdin, `trap` с `docker logout`, `pull`, `up -d`, `prune`. Порты в compose остаются на `127.0.0.1`.
- [ ] 10. Локально `docker compose up -d --build` без переменных по-прежнему работает: в compose у сервисов есть и `build:`, и `image:` со значениями по умолчанию.
- [ ] 11. На `pull_request` образы не публикуются; деплой выполняется только при `push` в `main`.
- [ ] 12. `ci/README.md` описывает контракт и различия между GitHub и GitLab.
- [ ] 13. В репозитории нет секретов; `~/.agents/scripts/security_scan.sh` без HIGH/CRITICAL.

## Тесты (пишет пользователь) (Tests, written by the user)
Агенты не создают и не редактируют тестовые файлы; они только предлагают кейсы ниже и запускают тесты.
Тесты не пишутся (решение пользователя). Критерии проверяются командами из списка критериев: make help, shellcheck, actionlint, docker build, security_scan.sh. Предложенные ранее случаи (bad-tag-latest, bad-tag-short, gitlab-short-sha, missing-registry, deploy-without-dir, logout-on-failure) остаются как идея на будущее.
- Статус (Status): not-needed
- Тесты агентами редактировать разрешено для этой задачи: нет

## Вне рамок (Out of scope)
- Dockerfile CI-образа с инструментами (следующая задача).
- SOPS / Vault (фаза 3).
- Ansible для раннеров (фаза 4).
- SSH с `restrict,command=` и откат на `.previous_tag` (фаза 5).
- semgrep / trivy / osv-scanner: в цели `scan` пока только gitleaks.
- Подписанные коммиты.
- Вынос шаблона в отдельный репозиторий `ci-templates`.
- Перенос проекта ic-group.

## Затронутые области и риски (Affected areas / risks)
- Modules: новые `Makefile`, `ci/` (скрипты, `versions.env`, `README.md`), `.gitlab-ci.yml`; замена файла `.github/workflows/docker-image.yml` на `.github/workflows/ci-cd.yml`.
- Data / migrations: миграций БД нет.
- Config / integrations: `docker-compose.yml` (добавляются `image:` рядом с `build:`); GHCR как реестр; self-hosted runner на VM.
- Риски:
  - Сломать локальный `docker compose up -d --build`. Митигация: критерий 10 и значения по умолчанию в compose.
  - Токен GHCR остаётся на диске VM. Митигация: `trap` с `docker logout` в `ci/deploy.sh`.
  - Runner на VM работает под личным пользователем `kebi`.
  - Группа `docker` эквивалентна root. Деплой разрешён только из `main`.
  - Порты публикуются только на `127.0.0.1`.

## Вопросы и ответы (Clarifications)
- Q: нет (уточнения не запрашивались; карточка составлена по запросу и плану из `~/Documents/Job/02_Plans/Универсальный CI CD.md`).

## Ссылки (Links)
- План: `~/Documents/Job/02_Plans/Универсальный CI CD.md`
- Branch: не создана (см. выше)
- Commits: нет
- ADR: нет
- Journal: docs/JOURNAL.md (не создан, заполняется при task-wrapup)
