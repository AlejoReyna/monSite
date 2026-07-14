import { NextRequest, NextResponse } from 'next/server';

const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_WEB3FORMS_KEY ?? "741c3f3b-5f5c-47e9-8dc4-3cf958848b98";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, interest } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const formData = {
      access_key: WEB3FORMS_ACCESS_KEY,
      name: name,
      email: email,
      message: message,
      interest: interest,
      subject: `Nueva consulta de ${name} - ${interest}`,
      from_name: "Portfolio Contact Form",
      to_name: "Alexis"
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.message || 'Failed to send message' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
