<?php

namespace Swissup\Breeze\Console\Command;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Filesystem;
use Swissup\Breeze\Model\BreezeThemesProvider;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestionFactory;
use Symfony\Component\Console\Question\ConfirmationQuestionFactory;
use Symfony\Component\Console\Question\QuestionFactory;

class AbstractCreateCommand extends Command
{
    /** @var Stubs */
    protected $stubs;

    /** @var ConfirmationQuestionFactory */
    protected $confirmationQuestionFactory;

    /** @var QuestionFactory */
    protected $questionFactory;

    /** @var ChoiceQuestionFactory */
    protected $choiceQuestionFactory;

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
        ChoiceQuestionFactory $choiceQuestionFactory,
        QuestionHelper $questionHelper
    ) {
        $this->stubs = $stubs;
        $this->directory = $filesystem->getDirectoryWrite(DirectoryList::APP);
        $this->confirmationQuestionFactory = $confirmationQuestionFactory;
        $this->questionFactory = $questionFactory;
        $this->choiceQuestionFactory = $choiceQuestionFactory;
        $this->questionHelper = $questionHelper;
        parent::__construct();
    }

    protected function initialize(InputInterface $input, OutputInterface $output)
    {
        $this->input = $input;
        $this->output = $output;
        return parent::initialize($input, $output);
    }

    protected function create($files)
    {
        $result = [];

        foreach ($files as $path => $values) {
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

    protected function ask($question, $validator = null)
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
