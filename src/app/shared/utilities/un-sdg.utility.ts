export interface UNSDG {
  title: string;
  value: string;
  color: string;
  icon?: string;
  profileCount?: number;
  researchCount?: number;
}

export const getUNSDGByValue = (value: string): UNSDG | undefined => {
  return goals.find((goal: UNSDG) => goal.value === value);
}

export const getUNSDGIndexByValue = (value: string): number | undefined => {
  return parseInt(value.split(' ')[0]);
}

export const goals: UNSDG[] = [
  { title: 'SDG 1', value: '1 No Poverty', color: '#E5243B' },
  { title: 'SDG 2', value: '2 Zero Hunger', color: '#DDA63A' },
  { title: 'SDG 3', value: '3 Good Health and Well-Being', color: '#4C9F38' },
  { title: 'SDG 4', value: '4 Quality Education', color: '#C5192D' },
  { title: 'SDG 5', value: '5 Gender Equality', color: '#FF3A21' },
  { title: 'SDG 6', value: '6 Clean Water and Sanitation', color: '#26BDE2' },
  { title: 'SDG 7', value: '7 Affordable and Clean Energy', color: '#FCC30B' },
  { title: 'SDG 8', value: '8 Decent Work and Economic Growth', color: '#A21942' },
  { title: 'SDG 9', value: '9 Industry, Innovation and Infrastructure', color: '#FD6925' },
  { title: 'SDG 10', value: '10 Reduced Inequalities', color: '#DD1367' },
  { title: 'SDG 11', value: '11 Sustainable Cities and Communities', color: '#FD9D24' },
  { title: 'SDG 12', value: '12 Responsible Consumption and Production', color: '#BF8B2E' },
  { title: 'SDG 13', value: '13 Climate Action', color: '#3F7E44' },
  { title: 'SDG 14', value: '14 Life Below Water', color: '#0A97D9' },
  { title: 'SDG 15', value: '15 Life on Land', color: '#56C02B' },
  { title: 'SDG 16', value: '16 Peace, Justice and Strong Institutions', color: '#00689D' },
  { title: 'SDG 17', value: '17 Partnerships for the Goals', color: '#19486A' }
];
