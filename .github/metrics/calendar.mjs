const query = `
  query ProfileContributionCalendar($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date weekday contributionCount contributionLevel }
          }
        }
      }
    }
  }
`;

const monthsFormat = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });

export default async function ({ login, graphql }) {
  const { user } = await graphql(query, { login });
  const { totalContributions, weeks } = user.contributionsCollection.contributionCalendar;
  const days = weeks.flatMap(({ contributionDays }) => contributionDays);
  if (days.length < 365 || new Set(days.map(({ date }) => date)).size !== days.length ||
      days.reduce((sum, { contributionCount }) => sum + contributionCount, 0) !== totalContributions) {
    throw new Error('GitHub returned an incomplete contribution calendar');
  }

  const months = [];
  let streak = 0;
  let longestStreak = 0;
  let busiestDay = 0;
  for (const [column, { contributionDays }] of weeks.entries()) {
    const firstOfMonth = contributionDays.find(({ date }) => date.endsWith('-01'));
    if (firstOfMonth) {
      months.push({ column, name: monthsFormat.format(new Date(firstOfMonth.date)) });
    }
    for (const { contributionCount } of contributionDays) {
      streak = contributionCount > 0 ? streak + 1 : 0;
      longestStreak = Math.max(longestStreak, streak);
      busiestDay = Math.max(busiestDay, contributionCount);
    }
  }

  return { totalContributions, weeks, months, longestStreak, busiestDay };
}
