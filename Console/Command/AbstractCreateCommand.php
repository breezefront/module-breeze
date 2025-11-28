<?php

namespace Swissup\Breeze\Console\Command;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Filesystem;
use Magento\Framework\Filesystem\Directory\WriteInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestionFactory;
use Symfony\Component\Console\Question\ConfirmationQuestionFactory;
use Symfony\Component\Console\Question\QuestionFactory;

class AbstractCreateCommand extends Command
{
    protected WriteInterface $directory;

    protected InputInterface $input;

    protected OutputInterface $output;

    public function __construct(
        protected Stubs $stubs,
        protected Filesystem $filesystem,
        protected ConfirmationQuestionFactory $confirmationQuestionFactory,
        protected QuestionFactory $questionFactory,
        protected ChoiceQuestionFactory $choiceQuestionFactory,
        protected QuestionHelper $questionHelper
    ) {
        $this->directory = $filesystem->getDirectoryWrite(DirectoryList::APP);
        parent::__construct();
    }

    protected function initialize(InputInterface $input, OutputInterface $output)
    {
        $this->input = $input;
        $this->output = $output;
        parent::initialize($input, $output);
    }

    protected function create($files)
    {
        $result = [];
        $isFirst = true;

        foreach ($files as $path => $values) {
            if ($isFirst) {
                $isFirst = false;
                $dir = dirname($path);
                if ($this->directory->isExist($dir)) {
                    throw new \Exception("Failed. Directory already exist: {$dir}");
                }
            }

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

    protected function getVendorName()
    {
        if ($vendor = $this->input->getOption('vendor')) {
            return $vendor;
        }

        if ($vendor = $this->ask('Enter vendor name: ')) {
            return $vendor;
        }

        throw new \Exception('Vendor name is required. Use --vendor=name.');
    }
}
