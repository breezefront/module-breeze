<?php

namespace Swissup\Breeze\Console\Command;

use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ModuleCreateCommand extends AbstractCreateCommand
{
    protected function configure()
    {
        $this->setName('breeze:module:create')
            ->setDescription('Create breeze module')
            ->addArgument('package', InputArgument::OPTIONAL, 'Package name (vendor/name)')
            ->addOption('for', null, InputOption::VALUE_REQUIRED, 'Use when creating an integration for a third-party module. Omit "package" when using this option.')
            ->addOption('vendor', null, InputOption::VALUE_REQUIRED, 'Vendor name')
            ->addOption('noxml', null, null, 'Do not generate layout XML')
            ->addOption('nocss', null, null, 'Do not generate CSS')
            ->addOption('nojs', null, null, 'Do not generate JS');

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        try {
            $package = $this->getPackageName();

            if (!$this->input->getArgument('package')) {
                $confirm = $this->ask($this->confirmationQuestionFactory->create([
                    'question' => "Do you want to create {$package} package? (y/n) [y]"
                ]));

                if (!$confirm) {
                    return;
                }
            }

            $paths = $this->create($this->stubs->module($package));

            foreach ($paths as $path => $success) {
                $this->output->writeln(
                    $success ? "<info>✓ {$path}</info>" : "<error>✗ {$path}</error>"
                );
            }

            $output->writeln('<info>Done! Do not forget to enable new module.</info>');
        } catch (\Exception $e) {
            $output->writeln('<error>' . $e->getMessage() . '</error>');
            if ($output->getVerbosity() >= OutputInterface::VERBOSITY_VERBOSE) {
                $output->writeln($e->getTraceAsString());
            }

            return \Magento\Framework\Console\Cli::RETURN_FAILURE;
        }

        return \Magento\Framework\Console\Cli::RETURN_SUCCESS;
    }

    private function getPackageName()
    {
        $package = $this->input->getArgument('package');
        if ($package) {
            return $package;
        }

        $vendor = $this->getVendorName();

        if ($for = $this->input->getOption('for')) {
            $package = strtr($for, [
                '/' => '-',
                'module-' => '',
                'magento-' => '',
                'magento2-' => '',
            ]);
        } else {
            $package = $this->ask('Enter package name: ');
        }

        if (strpos($package, 'module-breeze-') === false) {
            $package = 'module-breeze-' . $package;
        }

        return $vendor . '/' . $package;
    }
}
