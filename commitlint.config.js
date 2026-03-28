export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
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
