<?php

namespace Swissup\Breeze\Console\Command;

use Magento\Config\Console\Command\ConfigSet\ConfigSetProcessorFactory;
use Magento\Config\Model\ResourceModel\Config\Data\CollectionFactory;
use Magento\Framework\App\Config\ScopeCodeResolver;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\DeploymentConfig;
use Magento\Framework\App\Utility\Files;
use Magento\Framework\Console\Cli;
use Magento\Framework\Event\ManagerInterface;
use Magento\Framework\Simplexml\Config;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ConfigDumpCommand extends Command
{
    public function __construct(
        private CollectionFactory $collectionFactory,
        private ScopeCodeResolver $scopeCodeResolver,
        private DeploymentConfig $deploymentConfig,
        private Files $files,
        private ConfigSetProcessorFactory $configSetProcessorFactory,
        private ManagerInterface $eventManager
    ) {
        parent::__construct();
    }

    protected function configure()
    {
        $this->setName('breeze:config:dump')
            ->setDescription('Dump config that affects breeze bundles. Useful when using Magento pipeline deployment.')
            ->addOption('dry-run', null, null, 'Do not write result into config.php file');

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        if (!$this->deploymentConfig->isDbAvailable()) {
            $output->writeln(
                '<error>You cannot run this command because the Magento application is not installed.</error>'
            );
            return Cli::RETURN_FAILURE;
        }

        try {
            $report = [];
            $processor = $this->configSetProcessorFactory->create(ConfigSetProcessorFactory::TYPE_LOCK_CONFIG);
            $collection = $this->collectionFactory->create()
                ->addFieldToFilter('path', ['in' => $this->getConfigPaths()]);

            foreach ($collection as $item) {
                $scopeCode = $item->getScope() === ScopeConfigInterface::SCOPE_TYPE_DEFAULT
                    ? null
                    : $this->scopeCodeResolver->resolve($item->getScope(), $item->getScopeId());

                if ($input->getOption('dry-run')) {
                    $report[$scopeCode][$item->getPath()] = $item->getValue();
                } else {
                    $processor->process($item->getPath(), $item->getValue(), $item->getScope(), $scopeCode);
                }
            }

            ksort($report);
            foreach ($report as $scopeCode => $values) {
                $scopeCode = $scopeCode ?: 'Default';
                $output->writeln("<info>$scopeCode</info>");
                ksort($values);

                foreach ($values as $path => $value) {
                    $output->writeln($path . ': ' . $value);
                }
            }

            if ($input->getOption('dry-run')) {
                $output->writeln("<info>Done! {$collection->count()} paths found.</info>");
            } else {
                $output->writeln("<info>Done! {$collection->count()} paths were written.</info>");
            }
        } catch (\Exception $e) {
            $output->writeln('<error>' . $e->getMessage() . '</error>');

            if ($output->getVerbosity() >= OutputInterface::VERBOSITY_VERBOSE) {
                $output->writeln($e->getTraceAsString());
            }

            return Cli::RETURN_FAILURE;
        }

        return Cli::RETURN_SUCCESS;
    }

    private function getConfigPaths()
    {
        $exclude = [
            '/app/code/Magento/',
            '/app/design/frontend/Magento/',
            '/vendor/magento/',
        ];
        $include = [
            '/default.xml',
            '/default_head_blocks.xml',
            '/breeze_'
        ];

        $files = $this->files->getLayoutFiles(['area' => 'frontend'], false);
        $files = array_filter($files, function ($file) use ($exclude, $include) {
            foreach ($exclude as $path) {
                if (strpos($file, $path) !== false) {
                    return false;
                }
            }

            foreach ($include as $path) {
                if (strpos($file, $path) !== false) {
                    return true;
                }
            }

            return false;
        });

        $xpath = implode('|', [
            '//*[@name="breeze.js"]//item[@name="enabled"]/param',
            '//*[@name="breeze.js"]//item[@name="configPaths"]/item',
        ]);
        $configPaths = [];
        foreach ($files as $path) {
            $xml = new Config();
            if (!$xml->loadFile($path)) {
                continue;
            }

            $nodes = $xml->getXpath($xpath);
            if (!$nodes) {
                continue;
            }

            foreach ($nodes as $node) {
                foreach (explode(',', (string)$node) as $configPath) {
                    $configPaths[] = $configPath;
                }
            }
        }

        $transport = new \Magento\Framework\DataObject([
            'config_paths' => array_unique($configPaths),
        ]);

        $this->eventManager->dispatch('swissup_breeze_config_dump', [
            'transport' => $transport
        ]);

        return $transport->getConfigPaths();
    }
}
