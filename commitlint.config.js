// The public /changelog lists feat, fix and perf subjects. Vague marketing words
// there tell the reader nothing, so reject them. Stems catch inflected forms
// (enhanced, tweak, revamped). Applies to new commits only.
const VAGUE_WORDS = /\b(?:elevat|enhanc|revamp|tweak|seamless|various|misc)\w*\b/i

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-concrete': ({ type, subject }) => {
          if (!['feat', 'fix', 'perf'].includes(type) || !subject) return [true]
          const match = subject.match(VAGUE_WORDS)
          return [
            !match,
            `subject contains the vague word "${match?.[0]}"; say what changed`,
          ]
        },
      },
    },
  ],
  rules: {
    'subject-concrete': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'refactor',
        'chore',
        'test',
        'ci',
        'perf',
        'style',
        'build',
        'revert',
      ],
    ],
  },
}
