This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

This project uses Jest and React Testing Library for testing. Run tests with the following commands:

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci

# Run a specific test file
npm test -- src/__tests__/path/to/test.tsx
```

Tests are located in the `src/__tests__` directory and follow the same structure as the source code. For example, tests for pages are in `src/__tests__/pages`.

The project includes a pre-commit hook that runs tests before each commit to ensure that all tests pass before code is committed.

### Current Test Coverage

The following pages have test coverage:
- Home Page (`HomePage.test.tsx`)
- Product Page (`ProductPage.test.tsx`)
- Products List Page (`ProductsPage.test.tsx`)
- About Page (`AboutPage.test.tsx`)
- Contact Page (`ContactPage.test.tsx`)
- Privacy Page (`PrivacyPage.test.tsx`)

Each test verifies the page's rendering, content, and functionality while properly mocking dependencies.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
