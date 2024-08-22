import Link from 'next/link';
import { count } from 'drizzle-orm'
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { db } from '@/db'; // Update based on your configuration
import { Invoices } from '@/db/schema'; // Update based on your configuration

import { Button } from './ui/Button';

interface PaginationProps {
  currentPage: number;
  perPage: number;
}

export default async function Pagination({ currentPage, perPage }: PaginationProps) {
  const [{ count: invoicesCount }] = await db.select({
    count: count()
  }).from(Invoices);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, 5000)
  })
  return (
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
            {[...new Array(Math.ceil(invoicesCount / perPage))].map((_, index) => {
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
        { currentPage < Math.ceil(invoicesCount / perPage) && (
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
        { currentPage >= Math.ceil(invoicesCount / perPage) && (
          <span className="text-zinc-400 flex items-center gap-1">
            Next <ChevronRight className="w-5 h-5" />
          </span>
        )}
      </li>
    </ul>
  )
}