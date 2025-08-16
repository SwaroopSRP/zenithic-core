export const UserRolesEnum = {
    ADMIN: "Admin",
    LEAD: "Project Lead",
    MEMBER: "Member"
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    PENDING: "Pending",
    ONGOING: "Ongoing",
    FINISHED: "Finished"
};

export const AvailableTaskStatuses = Object.values(TaskStatusEnum);
