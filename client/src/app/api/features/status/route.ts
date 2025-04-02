import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import clientPromise from '../../../../lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });
    return NextResponse.json({ status: user?.status || 'Active' }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/features/status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { email },
      { $set: { status } },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Status updated' }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/features/status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}