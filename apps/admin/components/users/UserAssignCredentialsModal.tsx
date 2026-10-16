"use client";

import { AssignTemplateModal } from "@/components/users/AssignTemplateModal";

type Props = {
  userId: string;
  displayName: string;
  userEmail: string;
  projectId?: string;
  memberId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function UserAssignCredentialsModal({
  userId,
  displayName,
  userEmail,
  projectId,
  memberId,
  onClose,
  onSuccess,
}: Props) {
  const useProjectMember = Boolean(projectId && memberId);

  return (
    <AssignTemplateModal
      userId={useProjectMember ? undefined : userId}
      projectId={useProjectMember ? projectId : undefined}
      memberId={useProjectMember ? memberId : undefined}
      memberName={displayName}
      userEmail={userEmail}
      onClose={onClose}
      onAssigned={onSuccess}
    />
  );
}
