import { Icon } from './Icon';

interface PipelineStepProps {
  label: string;
  active?: boolean;
}

export function PipelineStep({ label, active }: PipelineStepProps) {
  return (
    <div className={`pipeline-step ${active ? 'pipeline-step-active' : ''}`}>
      {label}
    </div>
  );
}

export function PipelineArrow() {
  return (
    <Icon path="M9 5l7 7-7 7" size={20} className="pipeline-arrow" />
  );
}
