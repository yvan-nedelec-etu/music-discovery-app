import './SimpleCard.css';

/**
 * SimpleCard displays an optional image, title, subtitle, description and link.
 */
const SimpleCard = ({
  imageUrl,
  title,
  subtitle,
  description,
  link,
  className = '',
  ...rest // forwards data-testid and any other props
}) => {
  return (
    <div className={`simple-card ${className}`.trim()} {...rest}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title || 'Image'}
          className="simple-card__image"
        />
      )}
      {title && <h3 className="simple-card__title">{title}</h3>}
      {subtitle && (
        <p data-testid="subtitle" className="simple-card__subtitle">
          {subtitle}
        </p>
      )}
      {description && (
        <p className="simple-card__description">
          {description}
        </p>
      )}
      {link && (
        <a
          data-testid="link"
          href={link}
          className="simple-card__button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
      )}
    </div>
  );
};

export default SimpleCard;