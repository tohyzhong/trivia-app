export const createTransport = vi.fn().mockReturnValue({
  sendMail: vi.fn((options) => {
    const html = options.html || "";

    const verifyMatch = html.match(/verify&token=([\w.-]+)/);
    if (verifyMatch) global.verificationToken = verifyMatch[1];

    const resetMatch = html.match(/forgotpassword\?token=([\w.-]+)/);
    if (resetMatch) {
      global.resetToken = resetMatch[1];
    }

    const changePasswordMatch = html.match(
      /action=change-password&token=([\w.-]+)/
    );
    if (changePasswordMatch) {
      global.changePasswordToken = changePasswordMatch[1];
    }

    const emailMatch = html.match(/\/settings\/verify-action\?token=([\w.-]+)/);
    if (emailMatch) {
      global.changeEmailToken = emailMatch[1];
    }

    const deleteMatch = html.match(
      /\/settings\/verify-action\?action=delete-account\&token=([\w.-]+)/
    );
    if (deleteMatch) {
      global.deleteAccountToken = deleteMatch[1];
    }

    return Promise.resolve({ response: "Mock email sent" });
  })
});

export default { createTransport };
