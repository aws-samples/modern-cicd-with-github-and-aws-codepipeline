/**
 * Unit tests for monorepo configuration
 * Tests that npm workspaces are configured correctly and shared scripts work
 * Requirements: 8.2, 8.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Monorepo Configuration', () => {
  let rootPackageJson;
  let frontendPackageJson;
  let backendPackageJson;
  let infrastructurePackageJson;

  beforeAll(() => {
    // Load package.json files
    rootPackageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    frontendPackageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'frontend', 'package.json'), 'utf8')
    );
    backendPackageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'backend', 'package.json'), 'utf8')
    );
    infrastructurePackageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'infrastructure', 'package.json'), 'utf8')
    );
  });

  describe('Workspace Configuration', () => {
    test('root package.json should have workspaces defined', () => {
      expect(rootPackageJson.workspaces).toBeDefined();
      expect(Array.isArray(rootPackageJson.workspaces)).toBe(true);
    });

    test('workspaces should include frontend, backend, and infrastructure', () => {
      expect(rootPackageJson.workspaces).toContain('frontend');
      expect(rootPackageJson.workspaces).toContain('backend');
      expect(rootPackageJson.workspaces).toContain('infrastructure');
    });

    test('root package.json should be marked as private', () => {
      expect(rootPackageJson.private).toBe(true);
    });

    test('all workspace package.json files should be marked as private', () => {
      expect(frontendPackageJson.private).toBe(true);
      expect(backendPackageJson.private).toBe(true);
      expect(infrastructurePackageJson.private).toBe(true);
    });

    test('workspace directories should exist', () => {
      const workspaces = ['frontend', 'backend', 'infrastructure'];
      workspaces.forEach((workspace) => {
        const workspacePath = path.join(__dirname, '..', workspace);
        expect(fs.existsSync(workspacePath)).toBe(true);
        expect(fs.statSync(workspacePath).isDirectory()).toBe(true);
      });
    });

    test('each workspace should have a package.json file', () => {
      const workspaces = ['frontend', 'backend', 'infrastructure'];
      workspaces.forEach((workspace) => {
        const packageJsonPath = path.join(__dirname, '..', workspace, 'package.json');
        expect(fs.existsSync(packageJsonPath)).toBe(true);
      });
    });
  });

  describe('Shared Scripts', () => {
    test('root package.json should have dev scripts for each workspace', () => {
      expect(rootPackageJson.scripts['dev:frontend']).toBeDefined();
      expect(rootPackageJson.scripts['dev:backend']).toBeDefined();
      expect(rootPackageJson.scripts['dev']).toBeDefined();
    });

    test('root package.json should have build scripts for each workspace', () => {
      expect(rootPackageJson.scripts['build:frontend']).toBeDefined();
      expect(rootPackageJson.scripts['build:backend']).toBeDefined();
      expect(rootPackageJson.scripts['build']).toBeDefined();
    });

    test('root package.json should have test scripts for each workspace', () => {
      expect(rootPackageJson.scripts['test:frontend']).toBeDefined();
      expect(rootPackageJson.scripts['test:backend']).toBeDefined();
      expect(rootPackageJson.scripts['test']).toBeDefined();
    });

    test('root package.json should have lint scripts', () => {
      expect(rootPackageJson.scripts['lint']).toBeDefined();
      expect(rootPackageJson.scripts['lint:frontend']).toBeDefined();
      expect(rootPackageJson.scripts['lint:backend']).toBeDefined();
    });

    test('root package.json should have format scripts', () => {
      expect(rootPackageJson.scripts['format']).toBeDefined();
      expect(rootPackageJson.scripts['format:check']).toBeDefined();
    });

    test('workspace scripts should use npm-run-all for parallel execution', () => {
      expect(rootPackageJson.devDependencies['npm-run-all']).toBeDefined();
      expect(rootPackageJson.scripts['dev']).toContain('npm-run-all');
    });

    test('workspace-specific scripts should use --workspace flag', () => {
      expect(rootPackageJson.scripts['dev:frontend']).toContain('--workspace=frontend');
      expect(rootPackageJson.scripts['dev:backend']).toContain('--workspace=backend');
    });
  });

  describe('Shared Tooling Configuration', () => {
    test('root should have Prettier configuration', () => {
      const prettierrcPath = path.join(__dirname, '..', '.prettierrc');
      expect(fs.existsSync(prettierrcPath)).toBe(true);
      
      const prettierConfig = JSON.parse(fs.readFileSync(prettierrcPath, 'utf8'));
      expect(prettierConfig).toBeDefined();
      expect(prettierConfig.semi).toBeDefined();
      expect(prettierConfig.singleQuote).toBeDefined();
    });

    test('root should have ESLint configuration', () => {
      const eslintrcPath = path.join(__dirname, '..', '.eslintrc.json');
      expect(fs.existsSync(eslintrcPath)).toBe(true);
      
      const eslintConfig = JSON.parse(fs.readFileSync(eslintrcPath, 'utf8'));
      expect(eslintConfig).toBeDefined();
      expect(eslintConfig.extends).toBeDefined();
      expect(eslintConfig.parser).toBeDefined();
    });

    test('root should have TypeScript configuration', () => {
      const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
      
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig).toBeDefined();
      expect(tsconfig.compilerOptions).toBeDefined();
    });

    test('each workspace should have TypeScript configuration extending root', () => {
      const workspaces = ['frontend', 'backend', 'infrastructure'];
      workspaces.forEach((workspace) => {
        const tsconfigPath = path.join(__dirname, '..', workspace, 'tsconfig.json');
        expect(fs.existsSync(tsconfigPath)).toBe(true);
        
        // Read and parse tsconfig, handling comments
        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
        // Remove comments for JSON parsing
        const cleanedContent = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const tsconfig = JSON.parse(cleanedContent);
        expect(tsconfig.extends).toBe('../tsconfig.json');
      });
    });

    test('root should have shared dev dependencies', () => {
      expect(rootPackageJson.devDependencies['prettier']).toBeDefined();
      expect(rootPackageJson.devDependencies['eslint']).toBeDefined();
      expect(rootPackageJson.devDependencies['typescript']).toBeDefined();
    });
  });

  describe('Workspace Package Configuration', () => {
    test('frontend workspace should have correct name', () => {
      expect(frontendPackageJson.name).toBe('frontend');
    });

    test('backend workspace should have correct name', () => {
      expect(backendPackageJson.name).toBe('backend');
    });

    test('infrastructure workspace should have correct name', () => {
      expect(infrastructurePackageJson.name).toBe('infrastructure');
    });

    test('frontend workspace should have dev script', () => {
      expect(frontendPackageJson.scripts.dev).toBeDefined();
    });

    test('backend workspace should have dev script', () => {
      expect(backendPackageJson.scripts.dev).toBeDefined();
    });

    test('frontend workspace should have build script', () => {
      expect(frontendPackageJson.scripts.build).toBeDefined();
    });

    test('backend workspace should have build script', () => {
      expect(backendPackageJson.scripts.build).toBeDefined();
    });

    test('frontend workspace should have test script', () => {
      expect(frontendPackageJson.scripts.test).toBeDefined();
    });

    test('backend workspace should have test script', () => {
      expect(backendPackageJson.scripts.test).toBeDefined();
    });
  });

  describe('Directory Structure', () => {
    test('root should have README.md', () => {
      const readmePath = path.join(__dirname, '..', 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('each workspace should have README.md', () => {
      const workspaces = ['frontend', 'backend', 'infrastructure'];
      workspaces.forEach((workspace) => {
        const readmePath = path.join(__dirname, '..', workspace, 'README.md');
        expect(fs.existsSync(readmePath)).toBe(true);
      });
    });

    test('root should have .gitignore', () => {
      const gitignorePath = path.join(__dirname, '..', '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    test('root should have docker-compose.yml for local development', () => {
      const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });
  });

  describe('Node.js and npm Version Requirements', () => {
    test('root package.json should specify Node.js version requirement', () => {
      expect(rootPackageJson.engines).toBeDefined();
      expect(rootPackageJson.engines.node).toBeDefined();
      expect(rootPackageJson.engines.node).toContain('18');
    });

    test('root package.json should specify npm version requirement', () => {
      expect(rootPackageJson.engines).toBeDefined();
      expect(rootPackageJson.engines.npm).toBeDefined();
      expect(rootPackageJson.engines.npm).toContain('9');
    });
  });
});
