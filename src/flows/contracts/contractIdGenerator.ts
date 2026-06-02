import { BootstrapContext } from '../../bootstrap/types';

/**
 * Normalizes a name for use in contract ID generation
 * Removes spaces, special characters
 * Examples: "Gábor Koncz" -> "GáborKoncz", "Kovacs B" -> "KovacsB", "Cleantech Ltd." -> "CleantechLtd"
 */
export function normalizeNameForContractId(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'UNKNOWN';
  }

  return (
    name
      .trim()

      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/[\s-]+/g, '') || 'UNKNOWN'
  );
}

/**
 * Gets the next sequence number for a given partner/employee identifier
 */
async function getNextSequenceNumber(
  identifier: string,
  context: BootstrapContext,
): Promise<number> {
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const contractsService = new ItemsService('contracts', {
    accountability: { ...context.accountability, admin: true },
    schema,
  });

  const allContracts = await contractsService.readByQuery({
    filter: {
      contract_id: {
        _nnull: true,
      },
    },
    fields: ['contract_id'],
    limit: -1,
  });

  if (!allContracts || allContracts.length === 0) {
    return 1;
  }

  const prefix = `${identifier}-`;
  const sequences = allContracts
    .map((contract: any) => {
      const contractId = contract.contract_id;
      if (!contractId || typeof contractId !== 'string') return null;

      if (!contractId.startsWith(prefix)) return null;

      const sequencePart = contractId.substring(prefix.length);
      const match = sequencePart.match(/^(\d+)$/);
      if (!match || !match[1]) return null;

      const sequence = parseInt(match[1], 10);
      return isNaN(sequence) ? null : sequence;
    })
    .filter((seq: number | null): seq is number => seq !== null);

  if (sequences.length === 0) {
    return 1;
  }

  const maxSequence = Math.max(...sequences);
  return maxSequence + 1;
}

/**
 * Formats a sequence number as a zero-padded string (e.g., 1 -> "001", 42 -> "042")
 */
function formatSequenceNumber(sequence: number): string {
  return sequence.toString().padStart(3, '0');
}

/**
 * Generates a contract ID based on partner/employee name and sequence number.
 * Format: {NormalizedName}-{SequenceNumber}
 * Examples: "Cleantech-001", "KovacsB-002"
 */
export async function generateContractId(
  meta: Record<string, any>,
  context: BootstrapContext,
): Promise<string> {
  let otherPartyName: string | null = null;
  const otherPartyType = meta?.payload?.other_party_type;

  context.logger?.debug(
    `Generating contract ID. other_party_type: ${otherPartyType}, employee: ${meta?.payload?.employee}, partner: ${meta?.payload?.partner}`,
  );

  if (otherPartyType === 'employee' && meta?.payload?.employee) {
    const employeeService = new context.services.ItemsService('employees', {
      accountability: { ...context.accountability, admin: true },
      schema: await context.getSchema({ database: context.database }),
    });

    try {
      const employee = await employeeService.readOne(meta.payload.employee, {
        fields: ['account.first_name', 'account.last_name'],
      });

      if (employee?.account?.first_name && employee?.account?.last_name) {
        const fullName = `${employee.account.first_name} ${employee.account.last_name}`;
        otherPartyName = normalizeNameForContractId(fullName);
        context.logger?.debug(`Employee name normalized: ${fullName} -> ${otherPartyName}`);
      } else {
        context.logger?.warn(`Employee ${meta.payload.employee} found but missing name fields`);
      }
    } catch (error) {
      context.logger?.warn(`Failed to fetch employee data for contract ID generation: ${error}`);
    }
  } else if (otherPartyType === 'partner' && meta?.payload?.partner) {
    const partnerService = new context.services.ItemsService('partners', {
      accountability: { ...context.accountability, admin: true },
      schema: await context.getSchema({ database: context.database }),
    });

    try {
      const partner = await partnerService.readOne(meta.payload.partner, {
        fields: ['name'],
      });

      if (partner?.name) {
        otherPartyName = normalizeNameForContractId(partner.name);
        context.logger?.debug(`Partner name normalized: ${partner.name} -> ${otherPartyName}`);
      } else {
        context.logger?.warn(`Partner ${meta.payload.partner} found but missing name field`);
      }
    } catch (error) {
      context.logger?.warn(`Failed to fetch partner data for contract ID generation: ${error}`);
    }
  } else {
    context.logger?.warn(
      `Invalid other_party_type or missing partner/employee. Type: ${otherPartyType}`,
    );
  }

  if (!otherPartyName) {
    otherPartyName = 'CONTRACT';
    context.logger?.warn(`Using fallback name: ${otherPartyName}`);
  }

  const sequenceNumber = await getNextSequenceNumber(otherPartyName, context);
  const formattedSequence = formatSequenceNumber(sequenceNumber);
  const contractId = `${otherPartyName}-${formattedSequence}`;

  context.logger?.debug(`Generated contract ID: ${contractId} (sequence: ${sequenceNumber})`);

  return contractId;
}
