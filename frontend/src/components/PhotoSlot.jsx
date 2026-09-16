export default function PhotoSlot({ src, alt = '', height, width, className = '', style, children }) {
  const boxStyle = {
    ...(height ? { height } : null),
    ...(width ? { width } : null),
    ...style,
  };

  return (
    <div className={`ph-photo ${className}`} style={boxStyle}>
      {src ? (
        <img
          src={src}
          alt={alt}
          onError={(event) => {
            event.currentTarget.remove();
          }}
        />
      ) : (
        children || (
          <>
            <i className="ph ph-image" style={{ fontSize: 22 }} />
            фото
          </>
        )
      )}
    </div>
  );
}
