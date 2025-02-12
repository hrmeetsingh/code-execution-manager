import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programs } = body;

    const results = [];
    
    for (const program of programs) {
      // Create a temporary file for the code
      const fileExtension = getFileExtension(program.environment);
      const fileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = join(process.cwd(), 'temp', fileName);

      // Ensure temp directory exists
      await execAsync('mkdir -p temp');

      // Write code to file
      await writeFile(filePath, program.code);

      try {
        // Execute the code based on environment
        const { stdout, stderr } = await execAsync(getExecutionCommand(program.environment, filePath));
        
        // Check completion condition if specified
        const isCompleted = await checkCompletionCondition(program.completionCondition, stdout, stderr);

        results.push({
          programId: program.id,
          programName: program.name,
          success: true,
          output: stdout,
          error: stderr,
          completed: isCompleted
        });

        // Clean up temp file
        await execAsync(`rm ${filePath}`);
      } catch (execError: any) {
        results.push({
          programId: program.id,
          programName: program.name,
          success: false,
          output: execError.stdout,
          error: execError.stderr || execError.message,
          completed: false
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function getFileExtension(environment: string): string {
  switch (environment) {
    case 'node':
      return '.js';
    case 'python':
      return '.py';
    case 'java':
      return '.java';
    case 'bash':
      return '.sh';
    default:
      return '.txt';
  }
}

function getExecutionCommand(environment: string, filePath: string): string {
  switch (environment) {
    case 'node':
      return `node ${filePath}`;
    case 'python':
      return `python ${filePath}`;
    case 'java':
      return `java ${filePath}`;
    case 'bash':
      return `bash ${filePath}`;
    default:
      throw new Error('Unsupported environment');
  }
}

async function checkCompletionCondition(
  condition: string,
  stdout: string,
  stderr: string
): Promise<boolean> {
  if (!condition) return true;
  
  // Handle different types of completion conditions
  if (condition.startsWith('exit:')) {
    return stderr === '';
  }
  if (condition.startsWith('output:')) {
    const expectedOutput = condition.split('output:')[1].trim();
    return stdout.includes(expectedOutput);
  }
  if (condition.startsWith('no-error')) {
    return stderr === '';
  }
  
  return true;
}