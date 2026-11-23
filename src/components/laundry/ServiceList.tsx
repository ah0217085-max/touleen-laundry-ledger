import type { ServiceRecord } from "@/lib/laundry/types";
import { formatDate } from "@/lib/laundry/format";
import { laundry } from "@/lib/laundry/store";
import { DeliveryToggle } from "./DeliveryToggle";
import { RowActions } from "./RowActions";
import { Money } from "./Money";
import { ContactActions } from "./ContactActions";
import { DeliveredStamp } from "./DeliveredStamp";

interface Props {
  records: ServiceRecord[];
  detailsLabel: string;
  onEdit: (r: ServiceRecord) => void;
  onDelete: (r: ServiceRecord) => void;
}

const th = "px-3 py-3 text-start text-xs font-extrabold text-muted-foreground whitespace-nowrap";
const td = "px-3 py-3";

export function ServiceList({ records, detailsLabel, onEdit, onDelete }: Props) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {records.map((r) => (
          <li key={r.id} className="glass rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 truncate pt-2 text-base font-extrabold text-foreground">{r.customerName}</h3>
              <DeliveryToggle
                isDelivered={r.isDelivered}
                customerName={r.customerName}
                onToggle={() => laundry.toggleService(r.id)}
              />
            </div>
            <ContactActions phone={r.phoneNumber} customerName={r.customerName} className="mt-2" />
            <div className="mt-3 rounded-2xl bg-glass-strong p-3">
              <p className="text-xs font-semibold text-muted-foreground">{detailsLabel}</p>
              <p className="mt-0.5 text-sm font-bold leading-relaxed text-foreground">{r.serviceDetails}</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-glass-border pt-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">تاريخ الاستلام</dt>
                  <dd className="mt-0.5 font-bold text-foreground">{formatDate(r.receivedDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">تاريخ التسليم</dt>
                  <dd className="mt-0.5 text-xs">
                    <DeliveredStamp isDelivered={r.isDelivered} deliveredAt={r.deliveredAt} />
                  </dd>
                </div>
              </dl>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-semibold text-muted-foreground">الفاتورة: </span>
                <Money value={r.invoiceAmount} />
              </p>
              <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
            </div>
          </li>
        ))}
      </ul>

      <div className="glass hidden overflow-x-auto rounded-3xl md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-glass-strong">
            <tr>
              <th className={th}>اسم الزبون</th>
              <th className={th}>رقم الهاتف</th>
              <th className={th}>{detailsLabel}</th>
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
              <tr key={r.id} className="border-t border-glass-border transition hover:bg-glass-strong/60">
                <td className={`${td} whitespace-nowrap font-extrabold text-foreground`}>{r.customerName}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <ContactActions phone={r.phoneNumber} customerName={r.customerName} className="flex-nowrap" compact />
                </td>
                <td className={`${td} min-w-40 font-semibold leading-relaxed`}>{r.serviceDetails}</td>
                <td className={`${td} whitespace-nowrap font-semibold`}>{formatDate(r.receivedDate)}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <Money value={r.invoiceAmount} />
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <DeliveryToggle
                    isDelivered={r.isDelivered}
                    customerName={r.customerName}
                    onToggle={() => laundry.toggleService(r.id)}
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
