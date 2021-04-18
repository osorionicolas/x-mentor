package repositories

import akka.Done
import akka.Done.done
import com.redislabs.modules.rejson.JReJSON
import global.ApplicationResult
import io.circe.Decoder
import models.errors.{ClientError, UnexpectedError}
import play.api.Logging
import javax.inject.{Inject, Singleton}

import scala.util.Try
import io.circe.parser.decode
import util.JsonParsingUtils
import scala.reflect.ClassTag
import scala.reflect._

@Singleton
class RedisJsonRepository @Inject()(redisJson: JReJSON) extends Logging with JsonParsingUtils {

  def get[T](key: String)(implicit decoder: Decoder[T]): ApplicationResult[T] =
    Try(redisJson.get[String](key))
      .fold(
        error => {
          logger.info(s"Error getting key: $key from redisJSON")
          ApplicationResult.error(UnexpectedError(error))
        },
        jsonString => {
          decode[T](formatJsonResponse(jsonString))
            .fold(
              _ => {
                logger.info(s"Error decoding $jsonString")
                ApplicationResult.error(ClientError("Error decoding redisJSON response"))
              },
              value => ApplicationResult(value)
            )
        }
      )

  def getAll[T: ClassTag](keys: List[String])(implicit decoder: Decoder[T]): ApplicationResult[List[T]] = {
    Try(redisJson.mget(classTag[T].runtimeClass, keys:_*))
      .fold(
        error => {
          logger.info(s"Error getting keys from redisJSON. $error")
          ApplicationResult.error(UnexpectedError(error))
        },
        jsonArray => {
          decode[List[T]](jsonArray.toString)
            .fold(
              _ => {
                logger.info(s"Error decoding $jsonArray")
                ApplicationResult.error(ClientError("Error decoding redisJSON response"))
              },
              value => ApplicationResult(value)
            )
        }
      )
  }

  def set(key: String, jsonString: String): ApplicationResult[Done] = {
    logger.info(s"Uploading json with key: $key to redisJson")
    Try(redisJson.set(key, jsonString))
      .fold(
        error => {
          logger.info(s"Error uploading json to redisJson. Key: $key")
          ApplicationResult.error(UnexpectedError(error))
        },
        _ => ApplicationResult(done())
      )
  }

}