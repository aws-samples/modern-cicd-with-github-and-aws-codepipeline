module.exports = {
    default: {
      require: [
        'features/step_definitions/**/*.js'
      ],
      formatOptions: {
        snippetInterface: 'async-await'
      },
      timeout: 20000, // Set default timeout for each step to 20 seconds
    }
  };
  