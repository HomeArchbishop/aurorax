import { Command } from 'commander';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import { entryTemplate, pkgTemplate, readmeTemplate, templateTypes, packageManagers, } from '../templates';
function isInteractive() {
    return process.stdin.isTTY === true && process.stdout.isTTY === true;
}
export function initCommand() {
    return new Command('init')
        .description('Initialize a new Aurorax project interactively')
        .argument('[dir]', 'target directory')
        .option('-t, --template <type>', `entry template type (${templateTypes.join('|')})`)
        .option('-y, --yes', 'skip prompts and use defaults')
        .action(async (dirArg, options) => {
        let answers;
        if (options.yes || !isInteractive()) {
            answers = {
                dir: dirArg ?? '.',
                template: options.template ?? 'js',
                includeWebhook: false,
                installDeps: false,
                packageManager: 'npm',
            };
        }
        else {
            answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'dir',
                    message: 'Project directory:',
                    default: dirArg ?? '.',
                },
                {
                    type: 'select',
                    name: 'template',
                    message: 'Select entry template:',
                    choices: templateTypes,
                    default: options.template ?? 'js',
                },
                {
                    type: 'select',
                    name: 'packageManager',
                    message: 'Select package manager:',
                    choices: packageManagers,
                    default: 'npm',
                },
                {
                    type: 'confirm',
                    name: 'includeWebhook',
                    message: 'Include a sample webhook handler?',
                    default: false,
                },
                {
                    type: 'confirm',
                    name: 'installDeps',
                    message: 'Install dependencies now?',
                    default: true,
                },
            ]);
        }
        const type = templateTypes.includes(answers.template)
            ? answers.template
            : 'js';
        const target = path.resolve(answers.dir);
        await fs.mkdir(target, { recursive: true });
        const name = path.basename(target);
        const entryName = `index.${type}`;
        const pm = packageManagers.includes(answers.packageManager)
            ? answers.packageManager
            : 'npm';
        await fs.writeFile(path.join(target, entryName), entryTemplate(name, type, answers.includeWebhook));
        await fs.writeFile(path.join(target, 'package.json'), pkgTemplate(name, type, pm));
        await fs.writeFile(path.join(target, 'README.md'), readmeTemplate(pm));
        const runDev = pm === 'npm' || pm === 'bun' ? 'run dev' : 'dev';
        console.log('\n  aurorax project ready!');
        console.log('  ────────────────────────────────');
        console.log(`  Template         ${type}`);
        console.log(`  Package manager  ${pm}`);
        console.log(`  Directory        ${target}`);
        console.log('');
        console.log('  Next steps:');
        console.log(`  1. cd ${answers.dir === '.' ? '.' : name}`);
        console.log(`  2. ${pm} install`);
        console.log(`  3. ${pm} ${runDev}`);
        console.log('');
        if (answers.includeWebhook) {
            console.log('  Webhook endpoint: /webhook/github (POST)');
        }
    });
}
