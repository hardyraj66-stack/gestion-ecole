import { useViewing } from '../../contexts/ViewingContext';

export function ArchiveBanner() {
  const { viewing, exitView, isViewingArchive } = useViewing();

  if (!isViewingArchive || !viewing) return null;

  return (
    <div className="archive-banner" onClick={exitView}>
      <div className="archive-banner-inner">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="archive-banner-text">
          Consultation de l'année <strong>{viewing.label}</strong> (archivée · lecture seule)
        </span>
        <span className="archive-banner-action">
          ✕ Revenir à l'année en cours
        </span>
      </div>
    </div>
  );
}
