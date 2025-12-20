import { test, expect } from '@playwright/test';

test.describe('Quantho Smoke Tests', () => {
    const baseUrl = 'http://localhost:3000';

    test('should load login page', async ({ page }) => {
        await page.goto(baseUrl);
        await expect(page.locator('text=Quant\'ho')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('#auth-submit-button')).toBeVisible();
    });

    test('should toggle between login and registration', async ({ page }) => {
        await page.goto(baseUrl);
        const toggleButton = page.locator('#auth-toggle-button');
        const submitButton = page.locator('#auth-submit-button');

        // Initial state
        await expect(submitButton).toContainText(/(Accedi|Registrati|Gratuitamente)/);

        const initialText = await submitButton.innerText();
        await toggleButton.click();

        const afterToggleText = await submitButton.innerText();
        expect(initialText).not.toBe(afterToggleText);
    });

    test('should show forgot password form', async ({ page }) => {
        await page.goto(baseUrl);

        // Ensure we are in login mode
        const submitButton = page.locator('#auth-submit-button');
        const text = await submitButton.innerText();
        if (text.includes('Registrati')) {
            await page.click('#auth-toggle-button');
        }

        await page.click('#forgot-password-button');
        await expect(page.locator('text=Recupera Password')).toBeVisible();
        await expect(page.locator('#auth-submit-button')).toContainText(/(Invia|reset)/i);
    });
});
