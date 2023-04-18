import chalk from 'chalk';
import {copyComponents} from './helpers/copyComponents.js';
import {copyPackageJson} from './helpers/copyPackageJson.js';
import {exec} from 'child_process';
import path from 'path';
import prompts from 'prompts';
import {readComponents} from './helpers/readComponents.js';
import {readTemplates} from './helpers/readTemplates.js';

async function main() {
  const {action} = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      {
        title: 'Create a new component library',
        value: 'Create a new library'
      },
      {
        title: 'Add component(s) to an existing project',
        value: 'Add components'
      }
    ]
  });

  const templates = await readTemplates();
  const {template} = await prompts({
    type: 'select',
    name: 'template',
    message: 'Select a template',
    choices: templates.map((t) => ({title: t, value: t}))
  });

  let projectName;
  if (action === 'Create a new library') {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'What is your project named?',
      initial: 'my-component-library'
    });
    projectName = response.projectName;
  } else {
    projectName = '.';
  }

  const components = await readComponents(template);
  let {selectedComponents} = await prompts({
    type: 'multiselect',
    name: 'selectedComponents',
    message: 'Select the components you want to include',
    choices: [
      {title: 'All (Default)', value: 'All', selected: true},
      ...components.map((c) => ({title: c, value: c}))
    ]
  });
  if (selectedComponents.includes('All')) {
    selectedComponents = components;
  }

  let features = [
    {title: 'Tests (with Jest + React Testing Library)', value: 'Tests'},
    {title: 'Stories (with Storybook)', value: 'Stories'},
    {title: 'Docs (with Storybook Autodocs)', value: 'Docs'}
  ];
  let {includedFeatures} = await prompts({
    type: 'multiselect',
    name: 'includedFeatures',
    message: 'Select the features you want to include',
    choices: [
      {title: 'All (Default)', value: 'All', selected: true},
      ...features
    ]
  });
  if (includedFeatures.includes('All')) {
    includedFeatures = features.map((f) => f.value);
  }

  await copyComponents(selectedComponents, template, projectName, includedFeatures);

  if (action === 'Create a new library') {
    await copyPackageJson(template, projectName, includedFeatures);

    console.log(
      `Creating a new component library in ${path.resolve()}/${projectName}.`
    );
    console.log(`Initializing project with template: ${template}`);
    console.log('Installing dependencies...');

    exec(`cd ${projectName} && npm install`);
    console.log(
      chalk.green(
        `\nSuccess! Created ${projectName} at ${path.resolve()}/${projectName}`
      )
    );
  } else {
    console.log(chalk.green('\nComponents successfully added!'));
  }

  console.log(
    chalk.cyan('\nYou can access the React Aria Components docs here: ') +
    chalk.underline('https://react-spectrum.adobe.com/react-aria/react-aria-components.html')
  );

  if (action === 'Create a new library' && includedFeatures.includes('Stories')) {
    console.log(
      chalk.cyan(`\nYou can start Storybook by running:\n\ncd ${projectName}\nnpm run storybook`)
    );
  }

  process.exit(0);
}

main();
