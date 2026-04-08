# 🧪 Testing Guide for Sentinel AI

## 📋 Overview

Sentinel AI now includes a comprehensive testing suite using **Jest** with TypeScript support. The testing framework is designed to ensure code quality, functionality, and reliability.

## 🚀 Quick Start

### **Run All Tests**
```bash
npm test
```

### **Run Simple Tests**
```bash
npm run test:simple
```

### **Run Tests in Watch Mode**
```bash
npm run test:watch
```

### **Generate Coverage Report**
```bash
npm run test:coverage
```

### **Run Tests for CI/CD**
```bash
npm run test:ci
```

## 📁 Test Structure

```
src/tests/
├── services/
│   ├── moderation.service.test.ts    # Moderation service tests
│   └── ...                       # Other service tests
├── routes/
│   └── admin.routes.test.ts        # API route tests
├── utils/
│   ├── logger.test.ts              # Logger utility tests
│   └── redis.test.ts              # Redis utility tests
├── basic.test.ts                 # Basic functionality tests
├── simple.test.ts                 # Core structure tests
└── setup.ts                     # Test configuration and mocks
```

## 🧪 Test Categories

### **1. Unit Tests**
- **Services**: Test individual service methods
- **Utilities**: Test helper functions and utilities
- **Models**: Test data models and schemas

### **2. Integration Tests**
- **API Routes**: Test HTTP endpoints
- **Database**: Test database operations
- **External Services**: Test Redis, OpenAI integrations

### **3. Functional Tests**
- **Discord Bot**: Test bot commands and interactions
- **Moderation**: Test moderation workflows
- **Reports**: Test report generation and processing

## 📊 Test Coverage

### **Current Coverage Areas**
- ✅ **Basic Functionality** - Core logic validation
- ✅ **Project Structure** - Architecture validation
- ✅ **Environment Setup** - Configuration validation
- 🔄 **Services** - Service layer testing (in progress)
- 🔄 **API Routes** - Endpoint testing (in progress)
- 🔄 **Utilities** - Helper function testing (in progress)

### **Coverage Reports**
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## 🔧 Test Configuration

### **Jest Configuration**
- **Config File**: `jest.simple.config.js`
- **Preset**: `ts-jest` (TypeScript support)
- **Environment**: Node.js
- **Timeout**: 30 seconds
- **Mocks**: Auto-cleared and restored

### **Test Environment**
- **Database**: Uses separate test database (if available)
- **Redis**: Mocked Redis client
- **Discord**: Mocked Discord.js client
- **OpenAI**: Mocked OpenAI API

## 📝 Writing Tests

### **Test File Template**
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = await component.methodName(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
```

### **Mock Examples**
```typescript
// Mock external service
jest.mock('../../utils/redis', () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock database
const mockPrisma = {
  user: {
    create: jest.fn().mockResolvedValue({ id: '1', discordId: 'test' }),
    findUnique: jest.fn().mockResolvedValue(null),
  },
};
```

## 🎯 Best Practices

### **1. Test Naming**
- Use descriptive test names
- Follow "should [expected behavior]" pattern
- Include context in test descriptions

### **2. Test Structure**
- **Arrange**: Setup test data and mocks
- **Act**: Execute the method being tested
- **Assert**: Verify expected outcomes

### **3. Mock Management**
- Clear mocks before each test
- Use consistent mock data
- Mock external dependencies

### **4. Error Handling**
- Test success scenarios
- Test error scenarios
- Test edge cases

## 🚨 Current Test Status

### **✅ Working Tests**
- Basic functionality tests
- Project structure validation
- Environment configuration tests

### **🔄 In Progress**
- Service layer tests (some TypeScript issues)
- API route tests (mocking setup needed)
- Utility tests (dependency resolution)

### **📋 TODO Tests**
- Discord bot command tests
- AI integration tests
- End-to-end workflow tests
- Performance tests
- Security tests

## 🐛 Common Issues & Solutions

### **Issue**: TypeScript errors in tests
**Solution**: Use proper typing and null checks
```typescript
const user = await createTestUser('test-id');
if (!user) return; // Handle null case
```

### **Issue**: Mock not working
**Solution**: Ensure mock is defined before test file
```typescript
// In setup.ts
jest.mock('../../utils/redis', () => ({ ... }));
```

### **Issue**: Test database connection
**Solution**: Use environment variable or skip database tests
```typescript
if (!testPrisma) return; // Skip if no database
```

## 📈 CI/CD Integration

### **GitHub Actions Example**
```yaml
- name: Run Tests
  run: |
    npm ci
    npm run test:ci
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

## 🎯 Next Steps

1. **Fix TypeScript Issues**: Resolve remaining type errors
2. **Complete Service Tests**: Finish service layer coverage
3. **Add Integration Tests**: Test API endpoints thoroughly
4. **Add E2E Tests**: Test complete workflows
5. **Performance Testing**: Add load and stress tests
6. **Security Testing**: Add security vulnerability tests

## 📞 Support

For testing issues:
1. Check Jest configuration in `jest.simple.config.js`
2. Verify mock setup in `src/tests/setup.ts`
3. Review test examples in existing test files
4. Check TypeScript types and imports

---

**🧪 Happy Testing!**
