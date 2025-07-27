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

    const reportedUser = html.match(
      /<strong>Reported User:<\/strong>\s*(.*?)<\/p>/
    )?.[1];
    const reporter = html.match(
      /<strong>Reporter:<\/strong>\s*(.*?)<\/p>/
    )?.[1];
    const reasons = html.match(/<strong>Reasons:<\/strong>\s*(.*?)<\/p>/)?.[1];
    const source = html.match(/<strong>Source:<\/strong>\s*(.*?)<\/p>/)?.[1];
    const chatHtmls = html.match(
      /<h3>Chat History:<\/h3>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/
    );

    const chatHtmlMatch = html.match(
      /<h3>Chat History:<\/h3>\s*<div[^>]*>(.*?)<\/div>\s*<\/div>/s
    );
    if (chatHtmlMatch) {
      const chatHtml = chatHtmlMatch[1];
      global.lastReportEmail = {
        reportedUser,
        reporter,
        reasons,
        source,
        chatHtml: chatHtml?.trim()
      };
    }

    const approveMatch = html.match(
      /<p>Great news\! Your question has been reviewed and approved by an admin\.<\/p>([\s\S]+)/
    );
    if (approveMatch) global.approveText = approveMatch[1];

    const reasonMatch = html.match(
      /<p>We regret to inform you that your submitted question was not approved by the admin team\.<\/p>([\s\S]+)/
    );
    if (reasonMatch) {
      global.questionText = reasonMatch[1];
    }

    return Promise.resolve({ response: "Mock email sent" });
  })
});

export default { createTransport };
