'use client';

import React, { useState } from 'react';
import { PlusCircle, Trash2, MoveUp, MoveDown, Play, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';



const CodeExecutionManager = () => {
    const [programs, setPrograms] = useState([
        {
            id: 1,
            name: 'Program 1',
            code: '',
            environment: 'node',
            completionCondition: '',
            sequence: 1,
            isEditingName: false,
            status: 'idle'
        }
    ]);

    const environments = ['node', 'python', 'java', 'bash'];

    const handleCodeChange = (id: number, value: string) => {
        setPrograms(programs.map(program =>
            program.id === id ? { ...program, code: value } : program
        ));
    };

    const handleEnvironmentChange = (id: number, value: string) => {
        setPrograms(programs.map(program =>
            program.id === id ? { ...program, environment: value } : program
        ));
    };

    const handleCompletionConditionChange = (id: number, value: string) => {
        setPrograms(programs.map(program =>
            program.id === id ? { ...program, completionCondition: value } : program
        ));
    };

    const toggleNameEdit = (id: number) => {
        setPrograms(programs.map(program =>
            program.id === id ? { ...program, isEditingName: !program.isEditingName } : program
        ));
    };

    const handleNameChange = (id: number, value: string) => {
        setPrograms(programs.map(program =>
            program.id === id ? { ...program, name: value, isEditingName: false } : program
        ));
    };

    const addProgram = () => {
        const newId = Math.max(...programs.map(p => p.id)) + 1;
        const newSequence = programs.length + 1;
        setPrograms([...programs, {
            id: newId,
            name: `Program ${newSequence}`,
            code: '',
            environment: 'node',
            completionCondition: '',
            sequence: newSequence,
            isEditingName: false,
            status: 'idle'
        }]);
    };

    const removeProgram = (id: number) => {
        setPrograms(prevPrograms => {
            const filtered = prevPrograms.filter(program => program.id !== id);
            // Update sequence numbers
            return filtered.map((program, idx) => ({
                ...program,
                sequence: idx + 1
            }));
        });
    };

    const moveProgram = (id: number, direction: string) => {
        const index = programs.findIndex(p => p.id === id);
        if ((direction === 'up' && index === 0) ||
            (direction === 'down' && index === programs.length - 1)) return;

        const newPrograms = [...programs];
        const temp = newPrograms[index];
        if (direction === 'up') {
            newPrograms[index] = newPrograms[index - 1];
            newPrograms[index - 1] = temp;
        } else {
            newPrograms[index] = newPrograms[index + 1];
            newPrograms[index + 1] = temp;
        }

        // Update sequence numbers
        newPrograms.forEach((program, idx) => {
            program.sequence = idx + 1;
        });

        setPrograms(newPrograms);
    };

    const [executing, setExecuting] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const executePrograms = async () => {
        setExecuting(true);
        setResults([]);

        // Reset all program statuses
        setPrograms(programs.map(prog => ({
            ...prog,
            status: 'idle'
        })));

        const sortedPrograms = [...programs].sort((a, b) => a.sequence - b.sequence);

        for (const program of sortedPrograms) {
            // Update current program status to running
            setPrograms(prev => prev.map(p =>
                p.id === program.id ? { ...p, status: 'running' } : p
            ));

            try {
                const response = await fetch('/api/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        programs: [program]
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to execute program');
                }

                const result = data.results[0];
                setResults(prev => [...prev, result]);

                // Update program status based on result
                if (!result.success || !result.completed) {
                    setPrograms(prev => prev.map(p =>
                        p.id === program.id ? { ...p, status: 'failed' } : p
                    ));
                    break; // Stop execution if program fails
                }

                setPrograms(prev => prev.map(p =>
                    p.id === program.id ? { ...p, status: 'success' } : p
                ));

            } catch (error: any) {
                setResults(prev => [...prev, {
                    success: false,
                    error: error.message,
                    programName: program.name,
                    programId: program.id
                }]);

                setPrograms(prev => prev.map(p =>
                    p.id === program.id ? { ...p, status: 'failed' } : p
                ));
                break; // Stop execution on error
            }
        }

        setExecuting(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
          case 'running':
            return 'border-blue-400 bg-blue-50';
          case 'success':
            return 'border-green-400 bg-green-50';
          case 'failed':
            return 'border-red-400 bg-red-50';
          default:
            return 'border-gray-200 bg-white';
        }
      };
    
      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'running':
            return <Loader2 size={16} className="animate-spin text-blue-500" />;
          case 'success':
            return <div className="w-4 h-4 rounded-full bg-green-500" />;
          case 'failed':
            return <AlertCircle size={16} className="text-red-500" />;
          default:
            return <div className="w-4 h-4 rounded-full bg-gray-200" />;
        }
      };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Code Execution Manager</span>
                        <button
                            onClick={executePrograms}
                            disabled={executing}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                        >
                            {executing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Play size={16} />
                            )}
                            {executing ? 'Executing...' : 'Execute All'}
                        </button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {programs.sort((a, b) => a.sequence - b.sequence).map((program, index) => (
                            <div
                                key={program.id}
                                className={`p-4 border-2 rounded-lg transition-colors ${getStatusColor(program.status)}`}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(program.status)}
                                            {program.isEditingName ? (
                                                <input
                                                    type="text"
                                                    value={program.name}
                                                    onChange={(e) => handleNameChange(program.id, e.target.value)}
                                                    onBlur={() => toggleNameEdit(program.id)}
                                                    autoFocus
                                                    className="border rounded px-2 py-1"
                                                />
                                            ) : (
                                                <>
                                                    <h3 className="text-lg font-semibold">{program.name}</h3>
                                                    <button
                                                        onClick={() => toggleNameEdit(program.id)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveProgram(program.id, 'up')}
                                            className="p-2 hover:bg-gray-100 rounded"
                                            disabled={program.sequence === 1}
                                        >
                                            <MoveUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => moveProgram(program.id, 'down')}
                                            className="p-2 hover:bg-gray-100 rounded"
                                            disabled={program.sequence === programs.length}
                                        >
                                            <MoveDown size={16} />
                                        </button>
                                        <button
                                            onClick={() => removeProgram(program.id)}
                                            className="p-2 hover:bg-gray-100 rounded text-red-500"
                                            disabled={programs.length === 1}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Code
                                        </label>
                                        <textarea
                                            value={program.code}
                                            onChange={(e) => handleCodeChange(program.id, e.target.value)}
                                            className="w-full h-32 p-2 border rounded-md font-mono"
                                            placeholder="Enter your code here..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Environment
                                            </label>
                                            <select
                                                value={program.environment}
                                                onChange={(e) => handleEnvironmentChange(program.id, e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                            >
                                                {['node', 'python', 'java', 'bash'].map(env => (
                                                    <option key={env} value={env}>
                                                        {env.charAt(0).toUpperCase() + env.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Completion Condition
                                            </label>
                                            <input
                                                type="text"
                                                value={program.completionCondition}
                                                onChange={(e) => handleCompletionConditionChange(program.id, e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                                placeholder="e.g., exit code 0, specific output..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Show result for this program if available */}
                                {results.find(r => r.programId === program.id) && (
                                    <div className="mt-4">
                                        <Alert className={program.status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
                                            <AlertDescription>
                                                {program.status === 'success' ? (
                                                    <pre className="mt-2 text-sm whitespace-pre-wrap">
                                                        {results.find(r => r.programId === program.id)?.output}
                                                    </pre>
                                                ) : (
                                                    <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                                                        {results.find(r => r.programId === program.id)?.error}
                                                    </pre>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addProgram}
                        className="w-full mt-6 p-4 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={16} />
                        Add Another Program
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};

export default CodeExecutionManager;