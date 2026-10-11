"use client";

import { GenerateCredentialsModal } from "@/components/projects/GenerateCredentialsModal";

type Props = {
  projectId: string;
  member: { id: string; firstName: string; lastName: string; email: string };
  onClose: () => void;
  onSuccess: () => void;
};

export function UserAssignCredentialsModal({ projectId, member, onClose, onSuccess }: Props) {
  return (
    <GenerateCredentialsModal
      projectId={projectId}
      member={member}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
