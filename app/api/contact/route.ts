import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, service, message } = body;

    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Kiamina Website <onboarding@resend.dev>",
      to: "info@kiaminaaccounting.com",
      subject: `New website enquiry from ${name}`,
      replyTo: email,
      html: `
        <h2>New Website Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Service:</strong> ${service || "Not selected"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Unable to send message." },
      { status: 500 }
    );
  }
}