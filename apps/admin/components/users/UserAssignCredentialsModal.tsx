"use client";

import { AssignTemplateModal } from "@/components/users/AssignTemplateModal";

type Props = {
  projectId: string;
  memberId: string;
  memberName: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function UserAssignCredentialsModal({
  projectId,
  memberId,
  memberName,
  userEmail,
  onClose,
  onSuccess,
}: Props) {
  return (
    <AssignTemplateModal
      projectId={projectId}
      memberId={memberId}
      memberName={memberName}
      userEmail={userEmail}
      onClose={onClose}
      onAssigned={onSuccess}
    />
  );
}
