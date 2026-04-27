"// Test Data Structure
const testData = {
  levels: [
    { id: 1, name: 'Level 1 - Beginner' },
    { id: 2, name: 'Level 2 - Intermediate' },
    { id: 3, name: 'Level 3 - Advanced' }
  ],
  components: [
    { id: 1, name: 'Reading Comprehension', levels: [1, 2, 3] },
    { id: 2, name: 'Grammar and Vocabulary', levels: [1, 2, 3] },
    { id: 3, name: 'Writing', levels: [2, 3] }
  ],
  tests: [
    {
      testNumber: 101,
      level: 1,
      component: 1,
      title: 'Level 1 - Reading Comprehension Test',
      questions: [
        {
          id: 1,
          questionText: 'What is the main idea of this passage?',
          options: ['A. The importance of education', 'B. A historical event', 'C. Weather patterns', 'D. Sports achievements'],
          correctAnswer: 'A'
        },
        {
          id: 2,
          questionText: 'Which word means the same as \'enormous\'?',
          options: ['A. Tiny', 'B. Vast', 'C. Quiet', 'D. Happy'],
          correctAnswer: 'B'
        }
      ]
    },
    {
      testNumber: 102,
      level: 1,
      component: 2,
      title: 'Level 1 - Grammar and Vocabulary Test',
      questions: [
        {
          id: 1,
          questionText: 'Choose the correct form of the verb: She _____ to school every day.',
          options: ['A. go', 'B. goes', 'C. going', 'D. went'],
          correctAnswer: 'B'
        }
      ]
    }
  ]
};

// Export for use in other modules
export { testData };
""\"// Test Data Structure\nconst testData = {\n  levels: [\n    { id: 1, name: 'Level 1 - Beginner' },\n    { id: 2, name: 'Level 2 - Intermediate' },\n    { id: 3, name: 'Level 3 - Advanced' }\n  ],\n  components: [\n    { id: 1, name: 'Reading Comprehension', levels: [1, 2, 3] },\n    { id: 2, name: 'Grammar and Vocabulary', levels: [1, 2, 3] },\n    { id: 3, name: 'Writing', levels: [2, 3] }\n  ],\n  tests: [\n    {\n      testNumber: 101,\n      level: 1,\n      component: 1,\n      title: 'Level 1 - Reading Comprehension Test',\n      questions: [\n        {\n          id: 1,\n          questionText: 'What is the main idea of this passage?',\n          options: ['A. The importance of education', 'B. A historical event', 'C. Weather patterns', 'D. Sports achievements'],\n          correctAnswer: 'A'\n        },\n        {\n          id: 2,\n          questionText: 'Which word means the same as \'enormous\'?',\n          options: ['A. Tiny', 'B. Vast', 'C. Quiet', 'D. Happy'],\n          correctAnswer: 'B'\n        }\n      ]\n    },\n    {\n      testNumber: 102,\n      level: 1,\n      component: 2,\n      title: 'Level 1 - Grammar and Vocabulary Test',\n      questions: [\n        {\n          id: 1,\n          questionText: 'Choose the correct form of the verb: She _____ to school every day.',\n          options: ['A. go', 'B. goes', 'C. going', 'D. went'],\n          correctAnswer: 'B'\n        }\n      ]\n    }\n  ]\n};\n\n// Export for use in other modules\nexport { testData };""