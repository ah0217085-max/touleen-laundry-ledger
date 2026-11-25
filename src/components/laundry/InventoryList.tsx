import type { InventoryRecord } from "@/lib/laundry/types";
import { formatIntakeDateTime, formatNumber } from "@/lib/laundry/format";
import { laundry } from "@/lib/laundry/store";
import { DeliveryToggle } from "./DeliveryToggle";
import { RowActions } from "./RowActions";
import { Money } from "./Money";
import { ContactActions } from "./ContactActions";
import { DeliveredStamp } from "./DeliveredStamp";

interface Props {
  records: InventoryRecord[];
  countLabel: string;
  onEdit: (r: InventoryRecord) => void;
  onDelete: (r: InventoryRecord) => void;
}

const th = "px-4 py-3 text-start text-xs font-extrabold text-muted-foreground whitespace-nowrap";
const td = "px-4 py-3 whitespace-nowrap";

export function InventoryList({ records, countLabel, onEdit, onDelete }: Props) {
  return (
    <>
      {/* Phones: stacked cards */}
      <ul className="grid gap-3 md:hidden">
        {records.map((r) => (
          <li key={r.id} className="glass rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 truncate pt-2 text-base font-extrabold text-foreground">
                {r.customerName}
              </h3>
              <DeliveryToggle
                isDelivered={r.isDelivered}
                customerName={r.customerName}
                onToggle={() => laundry.toggleInventory(r.id)}
              />
            </div>
            <ContactActions
              phone={r.customerNumber}
              customerName={r.customerName}
              className="mt-2"
            />
            <dl className="mt-3 grid grid-cols-2 gap-2.5 rounded-2xl bg-glass-strong p-3 text-sm">
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{countLabel}</dt>
                <dd className="tnum mt-0.5 font-extrabold text-foreground">
                  {formatNumber(r.itemCount)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">الفاتورة</dt>
                <dd className="mt-0.5">
                  <Money value={r.invoiceAmount} showUnset />
                </dd>
              </div>
              <div className="col-span-2 min-w-0 border-t border-glass-border pt-2">
                <dt className="text-xs font-semibold text-muted-foreground">تاريخ الاستلام</dt>
                <dd className="mt-0.5 text-xs font-bold text-foreground">
                  {formatIntakeDateTime(r.receivedAt, r.receivedDate)}
                </dd>
              </div>
              {r.isDelivered && (
                <div className="col-span-2 min-w-0 border-t border-glass-border pt-2">
                  <dt className="text-xs font-semibold text-muted-foreground">تاريخ التسليم</dt>
                  <dd className="mt-0.5 text-xs">
                    <DeliveredStamp isDelivered={r.isDelivered} deliveredAt={r.deliveredAt} />
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-2 flex justify-end">
              <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
            </div>
          </li>
        ))}
      </ul>

      {/* Tablets and up: table */}
      <div className="glass hidden overflow-x-auto rounded-3xl md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-glass-strong">
            <tr>
              <th className={th}>اسم الزبون</th>
              <th className={th}>{countLabel}</th>
              <th className={th}>رقم الزبون</th>
              <th className={th}>تاريخ الاستلام</th>
              <th className={th}>الفاتورة المطلوبة</th>
              <th className={th}>حالة التسليم</th>
              <th className={th}>
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr
                key={r.id}
                className="border-t border-glass-border transition hover:bg-glass-strong/60"
              >
                <td className={`${td} font-extrabold text-foreground`}>{r.customerName}</td>
                <td className={`${td} tnum font-bold`}>{formatNumber(r.itemCount)}</td>
                <td className={td}>
                  <ContactActions
                    phone={r.customerNumber}
                    customerName={r.customerName}
                    className="flex-nowrap"
                    compact
                  />
                </td>
                <td className={`${td} text-xs font-semibold`}>
                  {formatIntakeDateTime(r.receivedAt, r.receivedDate)}
                </td>
                <td className={td}>
                  <Money value={r.invoiceAmount} showUnset />
                </td>
                <td className={td}>
                  <DeliveryToggle
                    isDelivered={r.isDelivered}
                    customerName={r.customerName}
                    onToggle={() => laundry.toggleInventory(r.id)}
                  />
                  {r.isDelivered && (
                    <div className="mt-1 whitespace-nowrap text-xs">
                      <DeliveredStamp isDelivered={r.isDelivered} deliveredAt={r.deliveredAt} />
                    </div>
                  )}
                </td>
                <td className={`${td} w-0`}>
                  <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
