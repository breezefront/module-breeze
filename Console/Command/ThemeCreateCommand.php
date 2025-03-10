<?php

namespace Swissup\Breeze\Console\Command;

use Magento\Framework\Filesystem;
use Swissup\Breeze\Model\BreezeThemesProvider;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestionFactory;
use Symfony\Component\Console\Question\ConfirmationQuestionFactory;
use Symfony\Component\Console\Question\QuestionFactory;

class ThemeCreateCommand extends AbstractCreateCommand
{
    /** @var BreezeThemesProvider */
    protected $breezeThemesProvider;

    public function __construct(
        Stubs $stubs,
        Filesystem $filesystem,
        ConfirmationQuestionFactory $confirmationQuestionFactory,
        QuestionFactory $questionFactory,
        ChoiceQuestionFactory $choiceQuestionFactory,
        QuestionHelper $questionHelper,
        BreezeThemesProvider $breezeThemesProvider
    ) {
        parent::__construct(
            $stubs,
            $filesystem,
            $confirmationQuestionFactory,
            $questionFactory,
            $choiceQuestionFactory,
            $questionHelper
        );

        $this->breezeThemesProvider = $breezeThemesProvider;
    }

    protected function configure()
    {
        $this->setName('breeze:theme:create')
            ->setDescription('Create breeze theme')
            ->addArgument('package', InputArgument::OPTIONAL, 'Package name (vendor/theme-frontend-name)')
            ->addOption('parent', null, InputOption::VALUE_REQUIRED, 'Parent theme code [Swissup/breeze-blank]')
            ->addOption('vendor', null, InputOption::VALUE_REQUIRED, 'Vendor name');

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        try {
            $parentTheme = $this->getParentTheme();
            $package = $this->getPackageName();

            if (!$this->input->getArgument('package')) {
                $confirm = $this->ask($this->confirmationQuestionFactory->create([
                    'question' => "Do you want to create {$package} theme? (y/n) [y]"
                ]));

                if (!$confirm) {
                    return \Magento\Framework\Console\Cli::RETURN_SUCCESS;
                }
            }

            $paths = $this->create($this->stubs->theme($package, $parentTheme));

            foreach ($paths as $path => $success) {
                $this->output->writeln(
                    $success ? "✓ {$path}" : "<error>✗ {$path}</error>"
                );
            }

            $output->writeln('<info>Done! Do not forget to activate your new theme from Content > Design > Configuration.</info>');
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
        $theme = $this->ask('Enter theme name: ');

        if (strpos($theme, 'theme-frontend-') === false) {
            $theme = 'theme-frontend-' . $theme;
        }

        return $vendor . '/' . $theme;
    }

    private function getParentTheme()
    {
        if (!$code = $this->input->getOption('parent')) {
            $code = $this->ask($this->choiceQuestionFactory->create([
                'question' => 'Select parent theme: ',
                'choices' => $this->getParentThemeChoices(),
            ]));
        }

        return $this->breezeThemesProvider->getTheme($code);
    }

    private function getParentThemeChoices()
    {
        $result = [];

        foreach ($this->breezeThemesProvider->getThemes() as $theme) {
            $result[$theme->getCode()] = $theme->getCode();
        }

        return $result;
    }
}
