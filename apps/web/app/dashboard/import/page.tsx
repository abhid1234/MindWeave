'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  ImportSourceSelector,
  ImportFileUpload,
  ImportPreview,
  ImportProgress,
  ImportSummary,
} from '@/components/import';
import { ImportSource, ParseResult, ImportResult, ImportItem } from '@/lib/import/types';
import { importContentAction } from '@/app/actions/import';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';

type Step = 'source' | 'upload' | 'preview' | 'importing' | 'complete';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('source');
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSourceSelect = useCallback((source: ImportSource) => {
    setSelectedSource(source);
    setSelectedFile(null);
    setParseResult(null);
    setSelectedItems(new Set());
    setError(null);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setParseResult(null);
    setSelectedItems(new Set());
    setError(null);
  }, []);

  const handleParseFile = useCallback(async () => {
    if (!selectedFile || !selectedSource) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('source', selectedSource);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Failed to parse file');
        return;
      }

      setParseResult(result as ParseResult);
      // Select all items by default
      setSelectedItems(new Set(result.items.map((_: ImportItem, i: number) => i)));
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, selectedSource]);

  const handleImport = useCallback(async () => {
    if (!parseResult || selectedItems.size === 0) return;

    setStep('importing');

    try {
      const itemsToImport = parseResult.items.filter((_, i) => selectedItems.has(i));
      const result = await importContentAction(itemsToImport);
      setImportResult(result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
      setStep('preview');
    }
  }, [parseResult, selectedItems]);

  const handleImportMore = useCallback(() => {
    setStep('source');
    setSelectedSource(null);
    setSelectedFile(null);
    setParseResult(null);
    setSelectedItems(new Set());
    setImportResult(null);
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'upload') {
      setStep('source');
    } else if (step === 'preview') {
      setStep('upload');
    }
  }, [step]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Content</h1>
        <p className="text-muted-foreground">
          Import your bookmarks, notes, and saved articles from other services.
        </p>
      </div>

      {/* Step indicator */}
      {step !== 'complete' && step !== 'importing' && (
        <StepIndicator
          steps={['Select Source', 'Upload File', 'Preview & Import']}
          currentStep={step === 'source' ? 0 : step === 'upload' ? 1 : 2}
        />
      )}

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 'source' && (
          <div className="space-y-6">
            <ImportSourceSelector selected={selectedSource} onSelect={handleSourceSelect} />

            <div className="flex justify-end">
              <Button onClick={() => setStep('upload')} disabled={!selectedSource}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'upload' && selectedSource && (
          <div className="space-y-6">
            <ImportFileUpload
              source={selectedSource}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={handleClearFile}
              disabled={isLoading}
              error={error}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleParseFile} disabled={!selectedFile || isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin">...</span>
                    Parsing...
                  </>
                ) : (
                  <>
                    Parse File
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && parseResult && (
          <div className="space-y-6">
            <ImportPreview
              parseResult={parseResult}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
            />

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedItems.size === 0}>
                <Upload className="mr-2 h-4 w-4" />
                Import {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <ImportProgress itemCount={selectedItems.size} isImporting={true} />
        )}

        {step === 'complete' && importResult && (
          <ImportSummary result={importResult} onImportMore={handleImportMore} />
        )}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center gap-2 ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStep
                    ? 'border-2 border-primary'
                    : 'border-2 border-muted-foreground/30'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </span>
            <span className="hidden text-sm font-medium sm:inline">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-4 h-0.5 w-8 sm:w-16 ${
                index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
