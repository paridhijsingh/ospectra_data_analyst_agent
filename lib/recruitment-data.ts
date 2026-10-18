export type Stage = 'Applied' | 'Screened' | 'Interviewed' | 'Offered' | 'Hired';
export type Department = 'Engineering' | 'Product' | 'Sales' | 'People' | 'Marketing' | 'Finance' | 'Customer Success';
export type Source = 'Referral' | 'LinkedIn' | 'Careers site' | 'Agency' | 'University' | 'Community event' | 'Internal mobility';
export type Location = 'San Francisco' | 'New York' | 'Remote' | 'Austin' | 'Chicago' | 'Atlanta';

export type Application = {
  id: string; candidateId: string; jobId: string; jobTitle: string; department: Department;
  location: Location; source: Source; appliedAt: string; stageReached: Stage; hiredAt?: string;
};

type JobSeed = { id: string; title: string; department: Department; location: Location; monthlyApplications: [number, number, number, number, number, number] };
const jobs: JobSeed[] = [
  { id:'J-101', title:'Software Engineer', department:'Engineering', location:'San Francisco', monthlyApplications:[14,16,18,19,22,26] },
  { id:'J-102', title:'Data Engineer', department:'Engineering', location:'Remote', monthlyApplications:[10,12,14,16,17,21] },
  { id:'J-103', title:'Machine Learning Engineer', department:'Engineering', location:'New York', monthlyApplications:[8,9,11,12,15,18] },
  { id:'J-104', title:'Product Manager', department:'Product', location:'New York', monthlyApplications:[8,10,11,13,14,16] },
  { id:'J-105', title:'Product Designer', department:'Product', location:'San Francisco', monthlyApplications:[7,8,10,11,12,14] },
  { id:'J-106', title:'Account Executive', department:'Sales', location:'Austin', monthlyApplications:[11,12,15,17,19,21] },
  { id:'J-107', title:'Sales Development Rep', department:'Sales', location:'Chicago', monthlyApplications:[13,15,17,19,21,24] },
  { id:'J-108', title:'Recruiter', department:'People', location:'Remote', monthlyApplications:[6,7,8,9,10,12] },
  { id:'J-109', title:'People Operations Partner', department:'People', location:'Atlanta', monthlyApplications:[5,6,7,8,9,10] },
  { id:'J-110', title:'Growth Marketing Manager', department:'Marketing', location:'Remote', monthlyApplications:[7,8,10,12,13,15] },
  { id:'J-111', title:'Financial Analyst', department:'Finance', location:'New York', monthlyApplications:[6,7,9,10,11,13] },
  { id:'J-112', title:'Revenue Accountant', department:'Finance', location:'Chicago', monthlyApplications:[5,6,7,8,10,11] },
  { id:'J-113', title:'Customer Success Manager', department:'Customer Success', location:'Austin', monthlyApplications:[9,10,12,14,15,17] },
  { id:'J-114', title:'Implementation Specialist', department:'Customer Success', location:'Atlanta', monthlyApplications:[7,8,9,11,12,14] },
];

export const monthKeys = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'] as const;
export const monthLabels = ['April','May','June','July','August','September'] as const;
const sources: Source[] = ['Referral','LinkedIn','Careers site','Agency','University','Community event','Internal mobility'];
const stages: Stage[] = ['Applied','Screened','Interviewed','Offered','Hired'];

// Deterministic synthetic operational data for a product demo. No real people or protected-class attributes are present.
export const applications: Application[] = [];
let applicationIndex = 0;
jobs.forEach((job, jobIndex) => {
  job.monthlyApplications.forEach((count, monthIndex) => {
    for (let rowIndex = 0; rowIndex < count; rowIndex += 1) {
      applicationIndex += 1;
      const source = sources[(rowIndex * 2 + jobIndex + monthIndex) % sources.length];
      const score = (rowIndex * 11 + jobIndex * 5 + monthIndex * 7) % 100;
      const stageIndex = score < 30 ? 0 : score < 55 ? 1 : score < 76 ? 2 : score < 90 ? 3 : 4;
      const day = String(1 + ((rowIndex * 3 + jobIndex * 2) % 25)).padStart(2,'0');
      const appliedAt = `${monthKeys[monthIndex]}-${day}`;
      const hireDate = new Date(`${appliedAt}T00:00:00Z`);
      hireDate.setUTCDate(hireDate.getUTCDate() + 14 + ((jobIndex * 4 + rowIndex * 3) % 30));
      applications.push({
        id:`A-${String(applicationIndex).padStart(4,'0')}`, candidateId:`C-${String(applicationIndex).padStart(4,'0')}`,
        jobId:job.id, jobTitle:job.title, department:job.department, location:job.location, source, appliedAt,
        stageReached:stages[stageIndex], hiredAt:stageIndex === 4 ? hireDate.toISOString().slice(0,10) : undefined,
      });
    }
  });
});

export const stageOrder: Stage[] = stages;
export const recruitmentCoverage = {
  applications: applications.length,
  roles: jobs.length,
  departments: new Set(jobs.map((job) => job.department)).size,
  locations: new Set(jobs.map((job) => job.location)).size,
  sources: sources.length,
  months: monthKeys.length,
};
