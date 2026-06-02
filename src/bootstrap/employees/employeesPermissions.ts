import { Permissions } from '../types';

export const EMPLOYEES_GENERAL_ACCESS: Permissions = [
  { collection: 'employees', action: 'read' },
  { collection: 'employees', action: 'create' },
  { collection: 'employees', action: 'update' },

  { collection: 'employees_trainings', action: 'read' },
  { collection: 'employees_trainings', action: 'create' },
  { collection: 'employees_trainings', action: 'update' },
  
  { collection: 'employees_commission_taxes', action: 'read' },
  { collection: 'employees_commission_taxes', action: 'create' },
  { collection: 'employees_commission_taxes', action: 'update' },
  
  { collection: 'employees_salary_taxes', action: 'read' },
  { collection: 'employees_salary_taxes', action: 'create' },
  { collection: 'employees_salary_taxes', action: 'update' },
];