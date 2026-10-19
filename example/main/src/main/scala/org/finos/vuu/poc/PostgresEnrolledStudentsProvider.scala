package org.finos.vuu.poc

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

import java.sql.DriverManager

class PostgresEnrolledStudentsProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends Provider {
  private val runner = new RunOnceLifeCycleRunner("postgresEnrolledStudentsProvider", () => loadSnapshot())

  lifecycle(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}
  override def doStart(): Unit = {}
  override def doStop(): Unit = {}
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = getClass.getSimpleName + "@" + hashCode()

  private def loadSnapshot(): Unit = {
    val connection = DriverManager.getConnection(databaseUrl, databaseUser, databasePassword)
    try {
      val statement = connection.prepareStatement(PostgresEnrolledStudentsProvider.enrolledStudentsQuery)
      try {
        val resultSet = statement.executeQuery()
        try {
          while (resultSet.next()) publishStudent(resultSet.getInt("id"), resultSet.getString("name"), resultSet.getString("phone_number"), resultSet.getInt("age"))
        } finally resultSet.close()
      } finally statement.close()
    } finally connection.close()
  }

  private def publishStudent(id: Int, name: String, phoneNumber: String, age: Int): Unit = {
    val key = id.toString
    table.processUpdate(key, RowWithData(key, Map("id" -> id, "name" -> name, "phoneNumber" -> phoneNumber, "age" -> age)))
  }

  private def databaseUrl: String = sys.env.getOrElse("VUU_POC_DATABASE_URL", "jdbc:postgresql://127.0.0.1:5434/vuu_poc")
  private def databaseUser: String = sys.env.getOrElse("VUU_POC_DATABASE_USER", "vuu")
  private def databasePassword: String = sys.env.getOrElse("VUU_POC_DATABASE_PASSWORD", "vuu_dev_password")
}

object PostgresEnrolledStudentsProvider {
  val enrolledStudentsQuery: String =
    """SELECT DISTINCT s.id, s.name, s.phone_number, s.age
      |FROM students AS s
      |WHERE EXISTS (
      |  SELECT 1
      |  FROM classes AS c
      |  WHERE s.id = ANY (c.student_ids)
      |)
      |ORDER BY s.id""".stripMargin
}
