import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { SubmissionStatus, getStatusLabel } from '@/types/submission';

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getVariant = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return 'gray';
      case SubmissionStatus.SUBMITTED:
        return 'info';
      case SubmissionStatus.UNDER_REVIEW:
        return 'warning';
      case SubmissionStatus.EVALUATED:
        return 'success';
      case SubmissionStatus.REJECTED:
        return 'destructive';
      default:
        return 'gray';
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {getStatusLabel(status)}
    </Badge>
  );
};
