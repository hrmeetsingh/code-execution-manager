'use client';

import React, { useState } from 'react';
import { PlusCircle, Trash2, MoveUp, MoveDown, Play, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


const CodeExecutionManager = () => {
    const [programs, setPrograms] = useState([
        {
            id: 1,
            name: 'Program 1',
            code: '',
            environment: 'node',
            completionCondition: '',
            sequence: 1,
            isEditingName: false
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
            isEditingName: false
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
        console.log('Executing programs in sequence:',
            programs.sort((a, b) => a.sequence - b.sequence));
        setExecuting(true);
        setResults([]);

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    programs: programs.sort((a, b) => a.sequence - b.sequence)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to execute programs');
            }

            setResults(data.results);
        } catch (error: any) {
            setResults([{
                success: false,
                error: error.message,
                programName: 'System Error'
            }]);
        } finally {
            setExecuting(false);
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
                    {programs.sort((a, b) => a.sequence - b.sequence).map(program => (
                        <div key={program.id} className="mb-6 p-4 border rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
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
                                            {environments.map(env => (
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
                        </div>
                    ))}

                    <button
                        onClick={addProgram}
                        className="w-full p-4 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2"
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