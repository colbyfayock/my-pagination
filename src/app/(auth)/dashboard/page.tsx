import Link from 'next/link';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { auth, } from '@clerk/nextjs/server';
import { eq, and, isNull, count } from 'drizzle-orm'

import { db } from '@/db';
import { Invoices, Customers } from '@/db/schema';
import { cn } from '@/lib/utils';
import { AVAILABLE_STATUSES } from '@/data/invoices';

import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import Container from '@/components/Container';
import { Button } from '@/components/ui/Button';

const INVOICES_PER_PAGE = 10;

export default async function Dashboard({ searchParams }: { searchParams: { page: string | undefined }}) {
  const { userId } = auth();
  if ( !userId ) return null;

  const currentPage = searchParams?.page ? parseInt(searchParams.page) : 1;

  const result = await db.select().from(Invoices)
    .innerJoin(Customers, eq(Invoices.customer_id, Customers.id))
    .where(
      and(
        eq(Invoices.user_id, userId),
        isNull(Invoices.organization_id)
      )
    )
    .limit(INVOICES_PER_PAGE)
    .offset(INVOICES_PER_PAGE * (currentPage - 1));

  const [{ count: invoicesCount }] = await db.select({
    count: count()
  }).from(Invoices)
    .innerJoin(Customers, eq(Invoices.customer_id, Customers.id))
    .where(
      and(
        eq(Invoices.user_id, userId),
        isNull(Invoices.organization_id)
      )
    );

  const invoices = result?.map(({ invoices, customers}) => {
    return {
      ...invoices,
      customer: customers
    }
  });

  return (
    <Container>
      <div className="flex justify-between items-center w-full mb-6">
        <h2 className="text-3xl font-semibold">
          Invoices
        </h2>
        <ul>
          <li>
            <Link href="/invoices/new" className="flex items-center gap-2 text-sm hover:text-blue-500">
              <PlusCircle className="w-4 h-4" />
              Create Invoice
            </Link>
          </li>
        </ul>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices?.map(invoice => {
            const status = AVAILABLE_STATUSES.find(status => status.id === invoice.status);
            return (
              <TableRow key={invoice.id}>
                <TableCell className="hidden md:table-cell p-0">
                  <Link href={`/invoices/${invoice.id}`} className="block p-4">
                    { new Date(invoice.create_ts).toLocaleDateString() }
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link href={`/invoices/${invoice.id}`} className="block p-4">
                    <p className="font-medium">
                      { invoice.customer.name }
                    </p>
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link href={`/invoices/${invoice.id}`} className="block p-4">
                    <p className="text-muted-foreground">
                      { invoice.customer.email }
                    </p>
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell p-0">
                  <Link href={`/invoices/${invoice.id}`} className="block p-4">
                    <Badge
                      className={cn(
                        "text-xs",
                        status?.id === 'open' && 'bg-blue-600',
                        status?.id === 'paid' && 'bg-green-600',
                        status?.id === 'void' && 'bg-zinc-700',
                        status?.id === 'uncollectible' && 'bg-red-600',
                      )}
                    >
                      { status?.label || 'Unknown' }
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-right p-0">
                  <Link href={`/invoices/${invoice.id}`} className="block p-4">
                    ${ invoice.value / 100 }
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <ul className="flex justify-between items-center text-sm mt-8">
        <li>
          { currentPage > 1 && (
            <Link href={{
              pathname: '/dashboard',
              query: {
                page: currentPage - 1
              }
            }}>
              <span className="flex items-center gap-1">
                <ChevronLeft className="w-5 h-5" /> Previous
              </span>
            </Link>
          )}
          { currentPage <= 1 && (
            <span className="text-zinc-400 flex items-center gap-1">
              <ChevronLeft className="w-5 h-5" /> Previous
            </span>
          )}
        </li>

        { typeof invoicesCount === 'number' && (
          <li className="flex-grow flex justify-center">
            <ul className="flex items-center gap-3">
              {[...new Array(Math.ceil(invoicesCount / INVOICES_PER_PAGE))].map((_, index) => {
                const page = index + 1;
                return (
                  <li key={page}>
                    <Button variant={page === currentPage ? 'default' : 'outline'} asChild size="sm" className="h-auto px-2.5 py-1">
                      <Link href={{
                        pathname: '/dashboard',
                        query: {
                          page
                        }
                      }}>
                        { page }
                      </Link>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </li>
        )}

        <li>
          { currentPage < Math.ceil(invoicesCount / INVOICES_PER_PAGE) && (
            <Link href={{
              pathname: '/dashboard',
              query: {
                page: currentPage + 1
              }
            }}>
              <span className="flex items-center gap-1">
              Next <ChevronRight className="w-5 h-5" />
              </span>
            </Link>
          )}
          { currentPage >= Math.ceil(invoicesCount / INVOICES_PER_PAGE) && (
            <span className="text-zinc-400 flex items-center gap-1">
              Next <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </li>
      </ul>

    </Container>
  );
}
