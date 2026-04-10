import type { StudentReport } from '../models/student-report.model';

export interface ReportLabels {
  student: string;
  registration: string;
  classes: string;
  educationLevel: string;
  gradeLevel: string;
  school: string;
  startDate: string;
  endDate: string;
  date: string;
  day: string;
  time: string;
  teacher: string;
  subjects: string;
  topics: string;
  noRegistration: string;
  noClasses: string;
  generatedOn: string;
}

export function buildStudentReportHtml(
  report: StudentReport,
  labels: ReportLabels,
  dateLocale: string,
): string {
  const { organization, student, registration, classes } = report;

  const logoHtml = organization.logoUrl
    ? `<img src="${escapeAttr(organization.logoUrl)}" alt="Logo" class="logo" />`
    : '';

  const registrationHtml = registration
    ? `<table>
        <tbody>
          <tr><th>${escape(labels.educationLevel)}</th><td>${escape(registration.educationLevelName)}</td></tr>
          <tr><th>${escape(labels.gradeLevel)}</th><td>${escape(registration.gradeLevelName)}</td></tr>
          <tr><th>${escape(labels.school)}</th><td>${escape(registration.schoolName)}</td></tr>
          <tr><th>${escape(labels.startDate)}</th><td>${escape(registration.startDate)}</td></tr>
          <tr><th>${escape(labels.endDate)}</th><td>${registration.endDate ? escape(registration.endDate) : '—'}</td></tr>
        </tbody>
      </table>`
    : `<p>${escape(labels.noRegistration)}</p>`;

  const classRows = classes
    .map(
      (c) => `
      <tr>
        <td>${escape(c.date)}</td>
        <td>${escape(c.dayOfWeek)}</td>
        <td>${escape(c.startTime)} – ${escape(c.endTime)}</td>
        <td>${escape(c.teacherName)}</td>
        <td>${
          c.topics
            .map((t) => escape(t.subjectName))
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(', ') || '—'
        }</td>
        <td>${c.topics.map((t) => escape(t.name)).join(', ') || '—'}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${escape(dateLocale)}">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
    .logo { max-height: 60px; max-width: 120px; object-fit: contain; }
    .org-name { font-size: 22px; font-weight: 700; color: #2563eb; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 15px; font-weight: 600; color: #2563eb; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .student-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; font-size: 12px; }
    th { background: #eff6ff; color: #1e40af; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <span class="org-name">${escape(organization.name)}</span>
  </div>

  <div class="section">
    <div class="section-title">${escape(labels.student)}</div>
    <div class="student-name">${escape(student.name)} ${escape(student.surname)}</div>
  </div>

  <div class="section">
    <div class="section-title">${escape(labels.registration)}</div>
    ${registrationHtml}
  </div>

  <div class="section">
    <div class="section-title">${escape(labels.classes)}</div>
    ${
      classes.length > 0
        ? `<table>
        <thead>
          <tr>
            <th>${escape(labels.date)}</th>
            <th>${escape(labels.day)}</th>
            <th>${escape(labels.time)}</th>
            <th>${escape(labels.teacher)}</th>
            <th>${escape(labels.subjects)}</th>
            <th>${escape(labels.topics)}</th>
          </tr>
        </thead>
        <tbody>${classRows}</tbody>
      </table>`
        : `<p>${escape(labels.noClasses)}</p>`
    }
  </div>

  <div class="footer">
    ${escape(labels.generatedOn)} ${new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</body>
</html>`;
}

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
