import React, { useEffect, useRef } from 'react';
// ✅ Import Bootstrap 5 styled DataTables
import DataTable from 'datatables.net-bs5';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css';

// ✅ Import extensions
import 'datatables.net-responsive-bs5';
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.html5';
import 'datatables.net-buttons/js/buttons.print';

type DataTableBasicProps = {
  data: (string | number)[][];
  columns: string[];
  options?: DataTables.Config;
};

const DataTableBasic: React.FC<DataTableBasicProps> = ({ data, columns, options }) => {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const dtRef = useRef<DataTables.Api | null>(null);

  useEffect(() => {
    if (!tableRef.current) return;

    // Destroy old instance before re-init (avoid duplication)
    if (dtRef.current) {
      dtRef.current.destroy();
      dtRef.current = null;
    }

    // Initialize DataTable
    dtRef.current = new DataTable(tableRef.current, {
      data,
      columns: columns.map((title) => ({ title })),
      paging: true,
      searching: true,
      responsive: true,
      autoWidth: false,
      dom: 'Bfrtip', // ✅ enables buttons toolbar
      buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
      ...options,
    });

    return () => {
      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [data, columns, options]);

  return (
    <table
      ref={tableRef}
      className="table table-striped table-bordered"
      style={{ width: '100%' }}
    />
  );
};

export default DataTableBasic;
