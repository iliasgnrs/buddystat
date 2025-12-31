import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { member, user } from "../../db/postgres/schema.js";

interface ListOrganizationMembersRequest {
  Params: {
    organizationId: string;
  };
}

export async function listOrganizationMembers(
  request: FastifyRequest<ListOrganizationMembersRequest>,
  reply: FastifyReply
) {
  try {
    const { organizationId } = request.params;

    const organizationMembers = await db
      .select({
        id: member.id,
        role: member.role,
        userId: member.userId,
        organizationId: member.organizationId,
        createdAt: member.createdAt,
        // User fields
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        userActualId: user.id,
      })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId));

    // Transform the results to the expected format
    return reply.send({
      success: true,
      data: organizationMembers.map(m => ({
        id: m.id,
        role: m.role,
        userId: m.userId,
        organizationId: m.organizationId,
        createdAt: m.createdAt,
        user: {
          id: m.userActualId,
          name: m.userName,
          email: m.userEmail,
        },
      })),
    });
  } catch (error) {
    console.error("Error listing organization members:", error);
    return reply.status(500).send({
      error: "InternalServerError",
      message: "An error occurred while listing organization members",
    });
  }
}
