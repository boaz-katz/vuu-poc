package org.finos.vuu.poc

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, TableDefOptions, ViewPortDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.net.rpc.DefaultRpcHandler

object SchoolModule {
  final val Name = "SCHOOL"
  final val EnrolledStudentsTable = "enrolledStudents"

  def apply()(implicit lifecycle: LifecycleContainer, clock: Clock, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(Name)
      .addTable(
        TableDef(
          name = EnrolledStudentsTable,
          keyField = "id",
          customColumns = Columns.fromNames(
            "id".int(),
            "name".string(),
            "phoneNumber".string(),
            "age".int()
          ),
          options = TableDefOptions(autoSubscribe = true, joinFields = List("id"))
        ),
        (table, _) => new PostgresEnrolledStudentsProvider(table),
        (table, _, _, _) => ViewPortDef(columns = table.getTableDef.getColumns, service = new DefaultRpcHandler {})
      )
      .asModule()
  }
}
