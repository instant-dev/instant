import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * GET
 */
export async function GET (context) {

  return `HTTP GET!`;

};

/**
 * POST
 */
export async function POST (context) {

  return `HTTP POST!`;

}

/**
 * PUT
 */
export async function PUT (context) {

  return `HTTP PUT!`;

};


/**
 * DELETE
 */
export async function DELETE (context) {

  return `HTTP DELETE!`;

};
