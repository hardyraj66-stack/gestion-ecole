interface MatierePillsItem {
  id: string;
  nom: string;
  couleur?: string;
}

interface MatierePillsProps {
  matieres: MatierePillsItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  singleSelect?: boolean;
}

export function MatierePills({ matieres, selectedIds, onToggle, singleSelect = false }: MatierePillsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {matieres.map(m => {
        const selected = singleSelect ? selectedIds[0] === m.id : selectedIds.includes(m.id);
        const couleur = m.couleur || 'var(--primary)';
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              border: `1.5px solid ${selected ? couleur : 'var(--border)'}`,
              background: selected ? `${couleur}18` : 'transparent',
              color: selected ? couleur : 'var(--text)',
              fontSize: '0.825rem',
              fontWeight: selected ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.12s',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: couleur, flexShrink: 0 }} />
            {m.nom}
          </button>
        );
      })}
    </div>
  );
}
