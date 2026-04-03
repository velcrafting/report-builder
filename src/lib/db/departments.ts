import { prisma } from "./prisma";

export type DepartmentRow = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  createdAt: Date;
};

export async function listDepartments(): Promise<DepartmentRow[]> {
  return prisma.department.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] });
}

export async function createDepartment(data: {
  value: string;
  label: string;
}): Promise<DepartmentRow> {
  return prisma.department.create({ data });
}

export async function deleteDepartment(id: string): Promise<void> {
  await prisma.department.delete({ where: { id } });
}
