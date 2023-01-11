<?php

namespace Swissup\Breeze\Console\Command;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Filesystem;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestionFactory;
use Symfony\Component\Console\Question\QuestionFactory;

class ModuleCreateCommand extends Command
{
    /** @var Stubs */
    protected $stubs;

    /** @var ConfirmationQuestionFactory */
    protected $confirmationQuestionFactory;

    /** @var QuestionFactory */
    protected $questionFactory;

    /** @var QuestionHelper */
    protected $questionHelper;

    /** @var InputInterface */
    protected $input;

    /** @var OutputInterface */
    protected $output;

    public function __construct(
        Stubs $stubs,
        Filesystem $filesystem,
        ConfirmationQuestionFactory $confirmationQuestionFactory,
        QuestionFactory $questionFactory,
        QuestionHelper $questionHelper
    ) {
        $this->stubs = $stubs;
        $this->directory = $filesystem->getDirectoryWrite(DirectoryList::APP);
        $this->confirmationQuestionFactory = $confirmationQuestionFactory;
        $this->questionFactory = $questionFactory;
        $this->questionHelper = $questionHelper;
        parent::__construct();
    }

    protected function configure()
    {
        $this->setName('breeze:module:create')
            ->setDescription('Create breeze integration module')
            ->addArgument('package', InputArgument::OPTIONAL, 'Package name. Use --for for autogeneraion.')
            ->addOption('for', null, InputOption::VALUE_REQUIRED, 'Package name to integrate')
            ->addOption('vendor', null, InputOption::VALUE_REQUIRED, 'Vendor name')
            ->addOption('noxml', null, null, 'Do not generate layout XML')
            ->addOption('nocss', null, null, 'Do not generate CSS')
            ->addOption('nojs', null, null, 'Do not generate JS');

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $this->input = $input;
        $this->output = $output;

        try {
            $package = $this->getPackageName();
            $confirm = $this->ask($this->confirmationQuestionFactory->create([
                'question' => "Do you want to create {$package} package? [y/n]"
            ]));

            if (!$confirm) {
                return;
            }

            $paths = $this->create($package);

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

        $vendor = $this->input->getOption('vendor');
        if (!$vendor) {
            if (!$vendor = $this->ask('Enter the vendor name: ')) {
                throw new \Exception('Vendor name is required. Use --vendor=name.');
            }
        }

        if ($for = $this->input->getOption('for')) {
            $package = strtr($for, [
                '/' => '-',
                'module-' => '',
                'magento-' => '',
                'magento2-' => '',
            ]);
        } else {
            $package = $this->ask('Enter the package name: ');
        }

        if (strpos($package, 'module-breeze-') === false) {
            $package = 'module-breeze-' . $package;
        }

        return $vendor . '/' . $package;
    }

    private function create(string $package)
    {
        $result = [];

        foreach ($this->stubs->module($package) as $path => $values) {
            if (!empty($values['skip']) && $this->input->getOption($values['skip'])) {
                continue;
            }

            $result[$path] = !$this->directory->isExist($path);
            if (!$result[$path]) {
                continue;
            }

            $this->directory->writeFile($path, $values['content']);
        }

        return $result;
    }

    private function ask($question, $validator = null)
    {
        if (is_string($question)) {
            $question = $this->questionFactory->create(['question' => $question]);

            if ($validator === null) {
                $validator = function ($value) {
                    if (!$value || trim($value) === '') {
                        throw new \Exception('Value cannot be empty');
                    }

                    return $value;
                };
            }
        }

        if ($validator) {
            $question->setValidator($validator);
        }

        return $this->questionHelper->ask($this->input, $this->output, $question);
    }
}
